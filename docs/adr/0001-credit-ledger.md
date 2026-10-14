# ADR-0001: Credits dùng sổ cái append-only + số dư cache

- Trạng thái: Accepted
- Ngày: 2026-10-14

## Bối cảnh

Credits là thứ duy nhất có giá trị trong hệ thống. Có bốn nguồn thay đổi (đăng ký, giới thiệu, xem bói, hoàn credit) cộng với chỉnh tay bằng script. Cần trả lời được "vì sao user này có X credits" và chống trừ trùng khi request song song. Database là MongoDB ([ADR-0005](0005-monorepo-nextjs-nestjs.md)).

## Quyết định

- Collection `credit_transactions` là sổ cái **append-only**: mỗi thay đổi là một document gồm:
  - `amount` (dương hoặc âm) và `type`;
  - `balanceAfter`;
  - tham chiếu tới reading/referral đã gây ra thay đổi đó.

  Không sửa, không xoá document nào.
- `users.creditBalance` là số dư cache, cập nhật trong **cùng MongoDB transaction** với document sổ cái.
- Trừ bằng một lệnh có điều kiện: `updateOne({ _id, creditBalance: { $gte: 1 } }, { $inc: { creditBalance: -1 } })`. Nếu `modifiedCount = 0` nghĩa là không đủ credits.
- Database tự chặn sai sót bằng:
  - validator `creditBalance >= 0`;
  - unique index cho `SIGNUP_BONUS` theo user;
  - unique index `(readingId, type)`;
  - unique index `referralId`.
- Chỉ `CreditLedgerService` được ghi hai collection này.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Chỉ có field `creditBalance` | Không truy vết được, khó điều tra khi credits bị sai |
| Chỉ có sổ cái, tính tổng mỗi lần đọc | Chậm dần theo thời gian; khó chặn trừ song song |
| Đọc số dư rồi trừ trong code | Hai request đọc cùng lúc sẽ cùng thấy đủ credits |

## Hệ quả

- MongoDB phải chạy dạng replica set (Atlas có sẵn; local dùng replica set 1 node) để dùng transaction.
- Mọi tính năng mới đụng tới credits phải thêm một `type` mới vào enum và đi qua `CreditLedgerService`.
- Có script `credits:reconcile` kiểm tra tổng sổ cái bằng số dư.
- Bán credits sau này chỉ cần thêm `type = PURCHASE`.
