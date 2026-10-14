# ADR-0002: Đăng nhập bằng token từ SDK, server tự xác minh

- Trạng thái: Accepted
- Ngày: 2026-10-14

## Bối cảnh

Yêu cầu đăng nhập bằng Google và Facebook. App là PWA, sau này có thể có app native dùng chung API. Cần quản lý credits theo user nội bộ, không phụ thuộc phiên của provider.

## Quyết định

- Client dùng **Google Identity Services** và **Facebook Login JS SDK** để lấy token (Google ID token / Facebook access token), rồi gửi lên `POST /auth/google` hoặc `POST /auth/facebook`.
- Server xác minh token trực tiếp với provider (kiểm tra `aud` của Google; `debug_token` của Facebook để chắc token thuộc đúng app).
- Server tự cấp access token JWT 15 phút + refresh token 30 ngày (cookie HttpOnly, lưu hash, xoay vòng).
- Mỗi user có mảng `identities` (nhúng trong document `users`) để một user có cả Google lẫn Facebook. Hai tài khoản cùng email đã xác minh được gộp thành một user.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Redirect OAuth flow phía server (Passport callback) | Nhiều redirect URI phải khai báo cho mỗi môi trường ngrok/prod; app native sau này vẫn phải làm luồng token |
| Auth.js (NextAuth) trong Next.js | Gắn auth vào web, API NestJS phải đọc lại session; khó dùng chung cho app native |
| Firebase Auth / Supabase Auth | Thêm nhà cung cấp và phụ thuộc; vẫn phải đồng bộ user sang MongoDB để làm credits |

## Hệ quả

- Phải tự viết và test kỹ phần xác minh token, xoay vòng refresh token.
- Facebook có thể không trả email → user Facebook không có email sẽ không tự liên kết với user Google.
- Đổi sang app native chỉ cần SDK native lấy token, API giữ nguyên.
