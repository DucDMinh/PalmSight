# deployment — Triển khai bằng các gói miễn phí

Mục tiêu: chạy thật với chi phí 0 đồng. Giới hạn của các gói free thay đổi theo thời gian; kiểm tra lại trang giá của từng dịch vụ trước khi dùng.

## Hạ tầng

| Thành phần | Dịch vụ (gói free) | Lưu ý |
| --- | --- | --- |
| Web (SPA React + Vite) | Vercel Hobby, host file tĩnh | Chỉ dùng cho dự án phi thương mại; có sẵn domain `*.vercel.app` |
| API (NestJS) | Render Free Web Service | Tự ngủ sau ~15 phút không có request; lần gọi đầu mất 30–60 giây để thức dậy |
| Database | MongoDB Atlas M0 | 512 MB, có replica set nên dùng được transaction |
| Lưu ảnh | Cloudflare R2 | 10 GB miễn phí; bucket private + lifecycle rule xoá ảnh sau 90 ngày |
| AI | Groq free tier, Gemini free tier | Giới hạn request/phút và /ngày |
| Gửi email | Gmail SMTP (tài khoản Gmail riêng + App Password) | Giới hạn khoảng vài trăm email/ngày; dễ vào Spam. **Cần kiểm tra Render free có cho kết nối ra cổng SMTP 465/587 không**: một số nền tảng free chặn cổng này. Nếu bị chặn, chuyển sang dịch vụ gửi mail qua HTTP API (Resend, Brevo) |
| Theo dõi lỗi | Sentry Developer (free) | Tuỳ chọn |

Lựa chọn thay thế cho API nếu Render không hợp: Koyeb free hoặc một VPS rẻ. **ngrok không dùng ở production.**

Tên miền riêng là tuỳ chọn. Dùng `*.vercel.app` vẫn được: Facebook App Domains và Google origins chấp nhận domain này.

## Định tuyến

Web và API chạy chung một domain để cookie `rt` hoạt động mà không cần cấu hình cross-site:

- `https://<app>.vercel.app/api/v1/*` → Vercel rewrite sang URL của API trên Render.
- File tĩnh có thật (JS, CSS, icon, `privacy.html`…) → Vercel trả thẳng.
- Mọi đường dẫn còn lại → `/index.html`, để React Router xử lý (SPA fallback).

Cấu hình trong `frontend/vercel.json`. Header bảo mật cũng khai báo ở file này, xem [security-privacy.md](security-privacy.md#hạ-tầng).

```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/api/v1/:path*", "destination": "https://palmsight-api.onrender.com/api/v1/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- Vercel không đọc biến môi trường trong `rewrites`, nên URL của API trên Render ghi thẳng vào file. URL này không phải secret. Đổi URL API thì phải sửa file này.
- `cleanUrls` cho phép `privacy.html` được phục vụ tại `/privacy`.

Khi dev, Vite dev server làm việc tương tự bằng `server.proxy`, với đích là `API_PROXY_TARGET`.

Cần lưu ý về thời gian chờ:

- Xem bói có thể mất tới 45 giây, và API trên Render có thể mất 30–60 giây để thức dậy.
- Rewrite của Vercel có giới hạn thời gian chờ khi proxy sang server ngoài. Cần kiểm tra giới hạn này khi triển khai.
- Groq thường trả kết quả trong vài giây, nên trường hợp bình thường không bị ảnh hưởng.
- Để tránh request đầu tiên bị timeout, web gọi `GET /api/v1/health` (có thử lại) khi mở app, để đánh thức API trước khi người dùng bấm xem bói.

## Biến môi trường

Toàn bộ danh sách ở [.env.example](../.env.example). Khác biệt so với dev:

| Biến | Production |
| --- | --- |
| `NODE_ENV` | `production` |
| `PUBLIC_BASE_URL` | `https://<app>.vercel.app` |
| `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID` | Đặt ở Vercel. Được nhúng vào bundle lúc build, nên đổi giá trị thì phải deploy lại |
| `MONGODB_URI` | Chuỗi `mongodb+srv://...` của Atlas |
| `JWT_ACCESS_SECRET` | Chuỗi ngẫu nhiên mới, ≥ 32 byte |
| `S3_ENDPOINT` | Endpoint R2 `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_FORCE_PATH_STYLE` | `false` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | `smtp.gmail.com`, `465`, `true` |
| `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Gmail của dự án + App Password; `MAIL_FROM` dùng đúng địa chỉ Gmail đó |

`API_PROXY_TARGET` chỉ dùng khi dev, production không cần.

Secret chỉ đặt trong phần Environment của Render, không bao giờ commit (repo công khai). Vercel chỉ cần các biến `VITE_*`, vốn không phải secret.

## Quy trình deploy

1. Merge vào `main` → CI chạy lint, typecheck, test, build.
2. Render tự build và chạy API:
   - Build: `pnpm install && pnpm --filter "backend..." build`. Hậu tố `...` build cả `shared` trước.
   - Start: `pnpm --filter backend db:sync-indexes && pnpm --filter backend start:prod`. Việc tạo index chạy được nhiều lần mà không gây hại.
3. Vercel tự deploy web:
   - Root Directory: `frontend`.
   - Build: `pnpm --filter "frontend..." build`.
   - Output: `dist`.
4. Smoke test: đăng ký bằng email (nhận được email xác minh, bấm link, có 3 credits), đăng nhập bằng username, quên mật khẩu, đăng nhập Google, đăng nhập Facebook, xem bói 1 lần, kiểm tra số dư.

Thay đổi schema MongoDB phải tương thích với dữ liệu cũ: field mới cần có giá trị mặc định, và code phải đọc được document thiếu field đó.

## Facebook và Google cho người ngoài dùng

Trước khi cho người ngoài đăng nhập:

- [ ] Có các trang `/privacy`, `/terms`, `/data-deletion`. Đây là HTML tĩnh trong `frontend/public/`, để crawler của Facebook đọc được mà không cần chạy JavaScript
- [ ] Facebook App: điền Privacy Policy URL, Terms URL, Data Deletion Instructions URL, icon, category; chuyển app sang **Live**
- [ ] Google OAuth consent screen: chuyển từ *Testing* sang *In production*

Nếu chỉ chơi với bạn bè, có thể giữ chế độ Development/Testing và thêm từng người vào danh sách test user.

## Vận hành

| Việc | Cách làm |
| --- | --- |
| Backup MongoDB | Atlas M0 không có backup tự động. Thỉnh thoảng chạy `mongodump` bằng tay, hoặc dùng GitHub Actions theo lịch |
| Xoá ảnh quá 90 ngày | Lifecycle rule của R2, không cần code |
| Dọn reading kẹt `PROCESSING` | Chạy định kỳ trong API khi API đang thức, và khi người dùng mở reading |
| Đối soát credits | Chạy tay `credits:reconcile` khi nghi có sai lệch |
| Kiểm tra dữ liệu mồ côi | Chạy `db:check` mỗi tuần, hoặc theo lịch bằng GitHub Actions; xem mục dưới |
| Xoá tài khoản theo yêu cầu | `users:delete`, xem [ADR-0009](adr/0009-manual-account-deletion.md) |
| Chỉnh credits tay | `credits:adjust --note "<lý do>"` |
| Theo dõi hạn mức Groq / Gemini | Xem dashboard của nhà cung cấp; log tỉ lệ `AI_UNAVAILABLE` |

Health check: `GET /api/v1/health` kiểm tra kết nối MongoDB (không gọi AI).

### Không sửa dữ liệu trực tiếp trên database

Không xoá hay sửa tay (bằng Compass, Atlas Data Explorer, mongosh) các collection `users`, `credit_transactions`, `referrals`, `readings`, `deleted_identities`. MongoDB không có khoá ngoại, nên xoá thẳng một user sẽ:

- để lại reading, ảnh, session, referral và giao dịch trỏ vào user không tồn tại;
- làm sổ cái lệch với số dư;
- **bỏ qua bước ghi `deleted_identities`**, nên người đó đăng ký lại vẫn nhận +3 và nhập mã được;
- để ảnh và kết quả bói nằm lại, tức là chưa xoá xong theo yêu cầu của người dùng.

Mọi thay đổi đi qua API hoặc script có sẵn. Nếu cần một thao tác mà chưa có script, viết script mới (đi qua `CreditLedgerService` nếu đụng tới credits) và ghi vào PR, không sửa tay.

### Phân quyền MongoDB

| User database | Quyền | Ai dùng |
| --- | --- | --- |
| `palmsight-app` | `readWrite` trên database `palmsight` | API trên Render; các script khi dev chạy tay |
| `palmsight-readonly` | `read` trên database `palmsight` | Xem dữ liệu hằng ngày bằng Compass hoặc mongosh |

- Chuỗi kết nối của `palmsight-app` chỉ nằm trong env của Render và trong `.env` của người chạy script, không dùng để mở Compass.
- Trên Atlas, tài khoản thành viên nên có project role chỉ đọc dữ liệu (ví dụ *Project Data Access Read Only*) khi xem bằng Data Explorer. Chỉ nâng quyền khi thật sự cần, rồi hạ lại.
- Khi dev local thì không cần tách quyền, vì dữ liệu là dữ liệu thử.

### Script `db:check`

Chỉ đọc, không tự sửa gì. In báo cáo và trả exit code khác 0 nếu có vấn đề, để chạy được trong GitHub Actions theo lịch.

| Kiểm tra | Phát hiện |
| --- | --- |
| Tổng sổ cái bằng số dư | Như `credits:reconcile` |
| Giao dịch, reading, session, referral, password reset có `userId` không tồn tại trong `users` | Ai đó đã xoá user trực tiếp |
| User có `deletedAt` nhưng còn email, username, mật khẩu, identity, session, hoặc reading còn ảnh/kết quả | `users:delete` chạy dở, hoặc ai đó sửa tay |
| Object trong `readings/` của bucket không còn reading tương ứng (hoặc reading có `imageKey = null`) | Ảnh mồ côi cần xoá |
| Reading `PROCESSING` quá 10 phút | Job dọn reading kẹt không chạy |

Khi có vấn đề: tìm nguyên nhân trước, rồi sửa bằng script có `--note`. Không xoá tay cho "sạch" báo cáo.
