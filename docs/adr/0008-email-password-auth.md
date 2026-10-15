# ADR-0008: Đăng ký và đăng nhập bằng email/mật khẩu, Google/Facebook là cách đăng nhập phụ

- Trạng thái: Accepted
- Ngày: 2026-10-14
- Bổ sung [ADR-0002](0002-token-based-oauth.md). Luồng token Google/Facebook và cơ chế JWT + refresh token giữ nguyên.

## Bối cảnh

Thiết kế ban đầu chỉ cho đăng nhập qua Google/Facebook. Người dùng không có hoặc không muốn dùng hai tài khoản đó thì không vào được app. Chủ dự án muốn có đăng ký/đăng nhập thông thường, còn Google/Facebook chỉ là cách đăng nhập nhanh thêm vào.

## Quyết định

- **Đăng ký** gồm tên hiển thị, username, email và mật khẩu.
  - Server **chưa tạo user**. Dữ liệu đăng ký được lưu vào `pending_registrations`, rồi server gửi link xác minh tới email.
- **Bắt buộc xác minh email trước khi đăng nhập.**
  - Bấm link xác minh mới tạo user và cộng `SIGNUP_BONUS`, rồi đăng nhập luôn.
  - Chưa xác minh thì không đăng nhập được: `403 EMAIL_NOT_VERIFIED`.
  - Link sống 24 giờ, gửi lại được.
  - Đăng ký chưa xác minh tự bị xoá khi link hết hạn (TTL index).
- **Đăng nhập** bằng email **hoặc** username, cùng với mật khẩu.
  - Username không được chứa `@`, nên chuỗi có `@` luôn được hiểu là email.
- **Quên mật khẩu**: gửi link đặt lại mật khẩu qua email, link sống 1 giờ và chỉ dùng một lần. Đặt lại xong thì mọi phiên đăng nhập bị thu hồi.
- **Gộp tài khoản theo email đã xác minh** (Google luôn xác minh email; Facebook chỉ khi trả về email; tài khoản mật khẩu luôn đã xác minh vì user chỉ được tạo sau khi xác minh):
  - Đăng nhập Google/Facebook với email trùng user có sẵn → gắn identity vào user đó.
  - Đăng ký mật khẩu với email trùng user chỉ có Google/Facebook (chưa có mật khẩu) → sau khi xác minh, gắn mật khẩu và username vào user đó, không cộng bonus.
  - Email đã thuộc user có mật khẩu → `409 EMAIL_TAKEN`.
  - Vì xác minh đòi quyền đọc hộp thư, không ai gắn được mật khẩu vào tài khoản của người khác.
- **Mật khẩu**:
  - Dài 8–128 ký tự, không bắt buộc ký tự đặc biệt, không được trùng email hoặc username.
  - Hash bằng **argon2id**, không lưu mật khẩu thô.
  - Token trong link email cũng chỉ lưu bản hash SHA-256.
- **Gửi email** qua **Gmail SMTP**, dùng App Password của một tài khoản Gmail riêng cho dự án, qua `nodemailer`. Khi dev, docker-compose chạy **Mailpit** để bắt email local, không gửi ra ngoài.
- **Đổi mật khẩu**: user đã có mật khẩu đổi ở `/account`, phải nhập mật khẩu cũ. User chỉ có Google/Facebook muốn có mật khẩu thì dùng "Quên mật khẩu" với email của mình.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Chỉ Google/Facebook (thiết kế cũ) | Người không dùng hai dịch vụ này không vào được app |
| Cho đăng nhập trước, xác minh sau mới có credits | Chủ dự án chọn bắt buộc xác minh: logic đơn giản hơn, không có user "nửa vời" |
| Không xác minh email | Tạo hàng loạt tài khoản bằng email giả để nhận +3 credits; không gộp an toàn với Google/Facebook được |
| Tạo user ngay lúc đăng ký, đánh dấu chưa xác minh | `users` lẫn tài khoản rác; mọi truy vấn phải lọc trạng thái; dễ cộng bonus nhầm |
| Resend / Brevo | Cần domain riêng để gửi tới người ngoài; Gmail SMTP đủ cho quy mô bạn bè |
| Firebase Auth / Supabase Auth | Thêm nhà cung cấp; vẫn phải đồng bộ user sang MongoDB để làm credits (như ADR-0002) |

## Hệ quả

- Thêm 2 collection: `pending_registrations`, `password_resets`. Thêm vào `users`: `username`, `passwordHash`, `passwordUpdatedAt`.
- Thêm phụ thuộc vào việc gửi email:
  - Gmail giới hạn khoảng vài trăm email/ngày với tài khoản thường (theo trí nhớ, cần kiểm tra).
  - Email dễ rơi vào thư rác, nên UI phải nhắc người dùng kiểm tra Spam.
  - Nếu số người dùng tăng, chuyển sang dịch vụ có domain riêng; chỉ cần đổi cấu hình SMTP.
  - Một số nền tảng free chặn kết nối ra cổng SMTP. Phải kiểm tra Render trước khi deploy; nếu bị chặn, phải dùng dịch vụ gửi mail qua HTTP API. `MailService` nên che chi tiết này để đổi được dễ dàng.
- Endpoint đăng ký, quên mật khẩu, gửi lại email xác minh có thể bị dùng để dò email và spam hộp thư. Biện pháp: rate limit, và các endpoint gửi email luôn trả `202` dù email có tồn tại hay không. Riêng đăng ký vẫn báo `EMAIL_TAKEN`/`USERNAME_TAKEN` để người dùng biết mà sửa; chấp nhận rủi ro dò email ở mức này.
- Boilerplate `frontend/` có sẵn trang Login (username/password), ForgotPassword, ChangePassword: giữ khung giao diện, viết lại logic theo API thật.
- `SIGNUP_BONUS` vẫn chỉ cộng khi **tạo user**, nên quy tắc bất biến #5 không đổi.
