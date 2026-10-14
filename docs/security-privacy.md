# security-privacy — Bảo mật và quyền riêng tư

Dự án nhỏ, repo công khai: mục tiêu là không lộ secret, không lộ ảnh của người dùng và không để credits bị cộng sai. Chống gian lận referral ở mức cơ bản là đủ; không có kiểm tra thiết bị/IP.

## Dữ liệu thu thập

| Dữ liệu | Nguồn | Mục đích | Lưu bao lâu |
| --- | --- | --- | --- |
| Tên, ảnh đại diện, email | Google / Facebook | Hiển thị hồ sơ, gộp tài khoản | Tới khi xoá tài khoản |
| ID tài khoản Google/Facebook | Google / Facebook | Đăng nhập | Tới khi xoá tài khoản |
| Ảnh lòng bàn tay | Người dùng tải lên | Phân tích bói | 90 ngày (lifecycle rule của bucket), hoặc tới khi người dùng xoá |
| Kết quả bói | AI | Hiển thị, lịch sử | Tới khi người dùng xoá reading/tài khoản |
| Lịch sử credits | Hệ thống | Đối soát | Tới khi xoá tài khoản |

Ảnh lòng bàn tay có thể bị xem là dữ liệu sinh trắc học. Nếu app được dùng rộng rãi, nên tìm hiểu quy định bảo vệ dữ liệu cá nhân của Việt Nam (Nghị định 13/2023/NĐ-CP và luật bảo vệ dữ liệu cá nhân mới). Thiết kế dưới đây giảm rủi ro bằng cách giữ ảnh ít nhất có thể.

## Bảo vệ ảnh

- Màn chụp ảnh có checkbox đồng ý: ảnh được gửi tới nhà cung cấp AI bên thứ ba (Groq, dự phòng Google Gemini) để phân tích.
- Bucket private; key ảnh là `readings/{userId}/{readingId}.jpg`; chỉ truy cập qua signed URL 5 phút sau khi kiểm tra quyền sở hữu.
- Xoá toàn bộ EXIF (có GPS) trước khi lưu và trước khi gửi AI.
- Lifecycle rule của bucket tự xoá object trong `readings/` sau 90 ngày, không cần job.
- `DELETE /readings/{id}` xoá ảnh ngay lập tức.
- Không log ảnh, base64 ảnh hay toàn bộ response AI.

## Xoá tài khoản

- Người dùng tự xoá ở `/account` (`DELETE /me`): xoá ảnh, kết quả, identity, session; ẩn danh hoá user (xoá tên, email, avatar). `_id` và sổ cái credits được giữ lại để đối soát.
- Facebook bắt buộc cung cấp **Data Deletion Instructions URL**; trang `/data-deletion` hướng dẫn thao tác trên.

## Xác thực

- **Google:** xác minh ID token phía server bằng thư viện chính thức, kiểm tra `aud` = `GOOGLE_CLIENT_ID`, `iss`, `exp`, `email_verified`.
- **Facebook:** gọi `debug_token` với app access token để chắc token được cấp cho **đúng app này**, rồi gọi `/me?fields=id,name,email,picture`.
- **Access token:** JWT 15 phút, giữ trong bộ nhớ trình duyệt (không lưu localStorage).
- **Refresh token:**
  - Lưu trong cookie `HttpOnly; Secure; SameSite=Lax`; database chỉ lưu bản hash.
  - Xoay vòng mỗi lần dùng.
  - Nếu một token cũ bị dùng lại → thu hồi toàn bộ phiên của user đó.
- Endpoint dùng cookie (`/auth/refresh`, `/auth/logout`) kiểm tra header `Origin` khớp `PUBLIC_BASE_URL`.

## Bảo vệ credits

| Rủi ro | Biện pháp |
| --- | --- |
| Gửi nhiều `POST /readings` cùng lúc để xem nhiều lần bằng 1 credit | Trừ bằng `updateOne` có điều kiện `creditBalance >= 1`, trong transaction |
| Gửi lại request, bị trừ 2 lần | `Idempotency-Key` unique theo user |
| Hoàn credit nhiều lần | Unique index `(readingId, type)` trên sổ cái |
| Nhập mã nhiều lần | Unique index `referrals.refereeId` |
| Hai người nhập mã của nhau để cùng được thưởng | Chặn bằng `REFERRAL_CYCLE` |
| Gắn cả Google + Facebook để nhận bonus 2 lần | Gộp theo email đã xác minh; bonus unique theo user |
| Dò mã giới thiệu | Rate limit 5 lần/giờ cho `POST /me/referral` |
| Một người tạo nhiều tài khoản ảo để tự nhận thưởng | Chấp nhận rủi ro; trần 10 lượt/ngày giới hạn thiệt hại |

Script `credits:reconcile` so tổng sổ cái với `creditBalance` của từng user; chạy tay hoặc định kỳ.

## AI

- Prompt yêu cầu bỏ qua mọi chữ trong ảnh, để chữ chèn vào ảnh không điều khiển được AI (prompt injection).
- Output phải qua zod schema; chuỗi bị giới hạn độ dài; UI chỉ hiển thị dạng text, không render HTML hay markdown từ AI.
- Cấm nội dung: chẩn đoán bệnh, tuổi thọ, cái chết, tai nạn, lời khuyên tài chính/pháp lý cụ thể.
- API key chỉ ở server; rate limit 5 lần/phút/user để bảo vệ hạn mức miễn phí.

## Repo công khai

- Không bao giờ commit `.env`; `.gitignore` đã chặn. Nếu lỡ commit key: **thu hồi key ngay**, sau đó mới xoá khỏi lịch sử git.
- Bật **Secret scanning** và **Push protection** trong Settings → Code security của repo.
- Bật Dependabot alerts.
- Ảnh mẫu dùng trong test phải là ảnh tay của chính thành viên dự án hoặc ảnh có quyền sử dụng.

## Hạ tầng

- HTTPS bắt buộc. Các header bảo mật cần đặt:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`, cho phép domain SDK của Google/Facebook
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Xác định loại ảnh bằng magic bytes, không tin header `Content-Type`; giải mã qua `sharp` với giới hạn số pixel.
- Không đặt secret trong biến `NEXT_PUBLIC_*`.
- MongoDB Atlas: Network Access chỉ mở cho IP của server nếu nền tảng cho IP cố định. Nếu không (gói free thường không có), dùng mật khẩu mạnh và user database chỉ có quyền trên database của app.
