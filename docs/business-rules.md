# business-rules — Credits & mã giới thiệu

## Quy tắc credits

Mọi thay đổi credits đều ghi một document vào sổ cái `credit_transactions`; `users.creditBalance` chỉ là số dư cache, luôn cập nhật trong cùng MongoDB transaction với document sổ cái.

| `type` | Khi nào phát sinh | Credits | Người nhận | Điều kiện |
| --- | --- | --- | --- | --- |
| `SIGNUP_BONUS` | Tài khoản được tạo ở lần đăng nhập đầu tiên | +3 | Người dùng mới | 1 lần/tài khoản (unique index) |
| `REFERRAL_BONUS` | Người khác nhập mã giới thiệu hợp lệ | +2 | Chủ mã (referrer) | Cộng ngay khi nhập mã; qua đủ kiểm tra ở mục dưới |
| `READING_SPEND` | Bắt đầu một lần xem bói | −1 | Người xem | `creditBalance >= 1` |
| `READING_REFUND` | AI lỗi, timeout hoặc trả sai định dạng; ảnh không phải lòng bàn tay (người dùng không mất credit) | +1 | Người xem | Tối đa 1 lần cho mỗi reading |
| `ADMIN_ADJUST` | Dev cộng/trừ tay bằng script (không có trang admin) | ±n | Bất kỳ | Bắt buộc có `note` |

**Hằng số cấu hình** (đọc từ env, không hard-code):

| Biến | Giá trị mặc định |
| --- | --- |
| `SIGNUP_BONUS_CREDITS` | 3 |
| `REFERRAL_REWARD_CREDITS` | 2 |
| `READING_COST_CREDITS` | 1 |
| `REFERRAL_DAILY_CAP` | 10 |

**Quy tắc khác**

- Credits **không hết hạn**.
- MVP **không bán** credits.
- Mỗi lần xem tốn đúng 1 credit, dù chọn trường phái nào và dù bói 1 mục hay toàn bộ.
- Đăng nhập Google và Facebook cùng email đã xác minh → **gộp thành một tài khoản**, chỉ nhận `SIGNUP_BONUS` một lần.
- Chỉnh credits tay: `pnpm --filter backend credits:adjust --user <id> --amount <n> --note "<lý do>"`, script này cũng đi qua `CreditLedgerService`.

**Mã giới thiệu**: 8 ký tự in hoa, bảng chữ bỏ ký tự dễ nhầm (`0 O 1 I L`), sinh ngẫu nhiên khi tạo user, unique. Link chia sẻ `https://<domain>/r/<CODE>` lưu mã vào cookie `ref_code` (7 ngày); sau khi đăng nhập, ô nhập mã được điền sẵn và người dùng bấm xác nhận. Người dùng có thể nhập mã **bất cứ lúc nào**, nhưng chỉ **một lần**.

## Kiểm tra khi nhập mã giới thiệu

Các kiểm tra chạy theo thứ tự; kiểm tra đầu tiên thất bại quyết định mã lỗi trả về.

| # | Kiểm tra | Thất bại thì | Mã lỗi / trạng thái |
| --- | --- | --- | --- |
| 1 | Mã tồn tại | Từ chối | `REFERRAL_CODE_NOT_FOUND` (404) |
| 2 | Không phải mã của chính mình | Từ chối | `REFERRAL_SELF` (422) |
| 3 | Tài khoản chưa từng nhập mã (unique `referrals.refereeId`) | Từ chối | `REFERRAL_ALREADY_USED` (409) |
| 4 | Chủ mã không phải người do mình giới thiệu (chặn hai người nhập mã của nhau) | Từ chối | `REFERRAL_CYCLE` (422) |
| 5 | Chủ mã chưa nhận đủ `REFERRAL_DAILY_CAP` lượt thưởng trong ngày (theo giờ Việt Nam) | Vẫn ghi nhận, không cộng | `status = CAPPED` |
| — | Qua tất cả | Cộng +2 ngay cho chủ mã | `status = REWARDED` |

Người được giới thiệu (người nhập mã) **không nhận thêm credits**.

Trần 10 lượt/ngày là trần mềm: hai lượt nhập đúng cùng lúc có thể cùng được tính là lượt thứ 10. Với dự án nhỏ, chấp nhận sai lệch này thay vì thêm cơ chế khoá.

## Quy tắc toàn vẹn (MongoDB)

- Mọi thao tác credits chạy trong **MongoDB transaction** (cần replica set; MongoDB Atlas và cấu hình docker local đều đáp ứng).
- Số dư không bao giờ âm:
  - Trừ bằng một lệnh có điều kiện: `updateOne({ _id, creditBalance: { $gte: 1 } }, { $inc: { creditBalance: -1 } })`.
  - Nếu `modifiedCount = 0` → trả `INSUFFICIENT_CREDITS` (402).
  - Collection `users` có thêm validator `creditBalance: { minimum: 0 }`.
- Unique index chặn cộng/hoàn trùng: `SIGNUP_BONUS` theo user, `(readingId, type)`, `referralId`. Chi tiết ở [database-erd.md](database-erd.md).
- `POST /readings` bắt buộc header `Idempotency-Key`; gửi lại cùng key trả lại reading cũ, không trừ thêm credit.
- Tổng `amount` trong `credit_transactions` của một user phải luôn bằng `users.creditBalance`; script `credits:reconcile` kiểm tra điều này.
