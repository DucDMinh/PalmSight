# ADR-0009: Không cho tự xoá tài khoản; xoá thủ công theo yêu cầu và chặn nhận thưởng lại

- Trạng thái: Accepted
- Ngày: 2026-10-14
- Sửa đổi 2026-10-15: server không còn lưu ảnh ([ADR-0010](0010-no-image-storage.md)), nên `users:delete` không còn bước xoá ảnh.

## Bối cảnh

Thiết kế trước có `DELETE /me`: người dùng tự xoá tài khoản, rồi đăng ký lại bằng cùng email hoặc cùng Google/Facebook để được tạo tài khoản mới. Mỗi vòng xoá–đăng ký như vậy nhận lại:

- `SIGNUP_BONUS` +3;
- quyền nhập mã giới thiệu lần nữa (người nhập +1, chủ mã +2).

Đây là cách farm credits không tốn gì.

Tuy vậy, vẫn không thể bỏ hẳn việc xoá dữ liệu:

- Facebook Login bắt buộc app khai báo **Data Deletion Instructions URL**.
- Luật bảo vệ dữ liệu cá nhân của Việt Nam cho người dùng quyền yêu cầu xoá dữ liệu của mình.

## Quyết định

- **Bỏ `DELETE /me`** và nút xoá tài khoản trong app.
- **Xoá thủ công theo yêu cầu:**
  - Trang `/data-deletion` hướng dẫn người dùng gửi email tới `SUPPORT_EMAIL`, từ chính địa chỉ email của tài khoản.
  - Tài khoản không có email (chỉ đăng nhập Facebook): gửi kèm **ID tài khoản** hiển thị ở `/account`; dev xác minh chủ tài khoản thủ công trước khi xoá.
  - Dev chạy `pnpm --filter backend users:delete --user <id> --note "<lý do / link yêu cầu>"`, trong vòng 30 ngày kể từ khi nhận yêu cầu.
- Script xoá làm đúng những việc `DELETE /me` cũ từng làm: xoá kết quả bói (từ [ADR-0010](0010-no-image-storage.md) server không còn lưu ảnh), mật khẩu, identity, session, token; ẩn danh hoá user. Thêm một bước: **ghi các định danh đã xoá vào `deleted_identities`**.
  - Mỗi định danh lưu dạng HMAC-SHA256 với secret `IDENTITY_HASH_SECRET`: email (chữ thường), Google `sub`, Facebook `id`.
  - Không lưu giá trị gốc. HMAC (thay vì SHA-256 trần) để không ai dò ngược email từ bảng hash được.
- **Tài khoản tạo lại** từ một định danh nằm trong `deleted_identities` (đăng ký email, Google hoặc Facebook):
  - vẫn được tạo và dùng bình thường;
  - **không** nhận `SIGNUP_BONUS` (bắt đầu với 0 credits);
  - **không** được nhập mã giới thiệu (`canEnterCode = false`), nên không ai nhận thưởng giới thiệu từ tài khoản đó;
  - vẫn có mã giới thiệu riêng, và vẫn nhận +2 khi người khác nhập mã của mình.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Giữ `DELETE /me`, chấp nhận farm | Chủ dự án không muốn; vòng xoá–đăng ký quá rẻ |
| Bỏ hẳn, không xoá dữ liệu | Facebook có thể không cho app chuyển sang Live; trái quyền yêu cầu xoá dữ liệu |
| Giữ `DELETE /me` + `deleted_identities` | Chặn được farm, nhưng chủ dự án chọn bỏ nút tự xoá cho đơn giản; xoá theo yêu cầu đủ cho quy mô dự án |
| Lưu email gốc của tài khoản đã xoá | Giữ dữ liệu cá nhân sau khi người dùng đã yêu cầu xoá |

## Hệ quả

- Dev phải xử lý yêu cầu xoá bằng tay. Với dự án nhỏ, số yêu cầu không đáng kể.
- `deleted_identities` được giữ vô thời hạn. Trang `/privacy` phải ghi rõ: "Sau khi xoá, chúng tôi giữ một mã băm không thể đảo ngược của email/ID đăng nhập để ngăn nhận lại khuyến mãi đăng ký".
- Người dùng muốn "làm lại từ đầu" bằng tài khoản mới sẽ bắt đầu với 0 credits.
- Thêm biến môi trường `IDENTITY_HASH_SECRET` và `SUPPORT_EMAIL`. Đổi `IDENTITY_HASH_SECRET` làm mất hiệu lực toàn bộ bảng chặn, nên **không bao giờ đổi** sau khi đã có dữ liệu.
- Xoá **chỉ** bằng `users:delete`, không bao giờ xoá thẳng document trong database. Xoá thẳng sẽ bỏ qua bước ghi `deleted_identities` (mở lại lỗ farm), để lại kết quả bói và dữ liệu mồ côi. `db:check` phát hiện các trường hợp này.
- Script không thu hồi được access token đã cấp (sống tối đa 15 phút). Auth guard đóng khe hở này bằng cách kiểm tra `deletedAt` ở mỗi request.
