# Getting started — Chạy dự án ở máy local

> Các lệnh dưới đây mô tả cấu trúc dự kiến; chúng chạy được sau khi Phase 0 trong [roadmap](roadmap.md) hoàn thành.

## 1. Cài đặt công cụ

| Công cụ | Phiên bản | Ghi chú |
| --- | --- | --- |
| Node.js | 22 LTS | |
| pnpm | 9 | `corepack enable && corepack prepare pnpm@9 --activate` |
| Docker Desktop | mới nhất | Chạy MongoDB và MinIO |
| ngrok | mới nhất | Tài khoản free + 1 static domain miễn phí |
| MongoDB Compass | tuỳ chọn | Xem dữ liệu bằng giao diện |

## 2. Clone và cài dependency

```bash
git clone <repo-url> palmsight
cd palmsight
pnpm install
cp .env.example .env
```

## 3. Khởi động dịch vụ nền

```bash
docker compose up -d
```

| Dịch vụ | Địa chỉ | Ghi chú |
| --- | --- | --- |
| MongoDB 7 | `localhost:27017` | Chạy dạng replica set 1 node (`rs0`), cần cho transaction; container tự chạy `rs.initiate()` |
| MinIO API | `localhost:9000` | `minioadmin` / `minioadmin` |
| MinIO Console | `http://localhost:9001` | Tạo bucket `palmsight-images` (private) |
| Mailpit SMTP | `localhost:1025` | Bắt mọi email backend gửi ra; không gửi tới hộp thư thật |
| Mailpit UI | `http://localhost:8025` | Mở để bấm link xác minh email và link đặt lại mật khẩu khi dev |

Link trong email được tạo từ `PUBLIC_BASE_URL`. Khi test trên điện thoại qua ngrok, đặt biến này là domain ngrok, để link mở được trên điện thoại.

Chuỗi kết nối trong `.env`:

```bash
MONGODB_URI=mongodb://localhost:27017/palmsight?replicaSet=rs0&directConnection=true
```

## 4. Tạo index và dữ liệu mẫu

```bash
pnpm --filter backend db:sync-indexes    # tạo index + validator theo schema
pnpm --filter backend db:seed            # vài user mẫu đã xác minh, có sẵn credits, mật khẩu in ra màn hình
```

## 5. Lấy API key và cấu hình đăng nhập

### ngrok (làm trước, vì đăng nhập Facebook cần URL HTTPS)

1. Đăng ký tại ngrok.com, copy authtoken vào `NGROK_AUTHTOKEN`, chạy `ngrok config add-authtoken <token>`.
2. Dashboard → **Domains** → nhận static domain miễn phí, ví dụ `palmsight-dev.ngrok-free.app`. Mỗi thành viên nên có domain riêng.
3. Đặt `PUBLIC_BASE_URL=https://palmsight-dev.ngrok-free.app`.
4. Thêm domain ngrok vào `server.allowedHosts` trong `frontend/vite.config.ts`. Có thể đọc từ `PUBLIC_BASE_URL`. Nếu thiếu, Vite chặn request với lỗi "Blocked request. This host is not allowed".

### Gmail SMTP (chỉ cần khi muốn gửi email thật)

Khi dev, Mailpit là đủ. Chỉ làm bước này khi muốn thử gửi tới hộp thư thật, hoặc khi deploy.

1. Tạo một tài khoản Gmail riêng cho dự án. Không dùng Gmail cá nhân, vì mật khẩu ứng dụng cho phép gửi mail thay bạn.
2. Bật **Xác minh 2 bước** cho tài khoản đó (bắt buộc để có App Password).
3. myaccount.google.com → **Security → App passwords** → tạo mật khẩu cho "PalmSight", copy chuỗi 16 ký tự.
4. Điền vào `.env`:

   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=palmsight.app@gmail.com
   SMTP_PASS=<app password 16 ký tự>
   MAIL_FROM="PalmSight <palmsight.app@gmail.com>"
   ```

Gmail ghi đè địa chỉ người gửi bằng `SMTP_USER`, nên `MAIL_FROM` phải dùng đúng địa chỉ đó.

### Groq

1. Tạo key tại console.groq.com → **API Keys**, điền `GROQ_API_KEY`.
2. Kiểm tra trang **Models**, chọn một model hỗ trợ ảnh (vision), điền `AI_MODEL`.

### Google

1. console.cloud.google.com → tạo project → **APIs & Services → OAuth consent screen**, loại External, thêm email của 2 thành viên làm test user.
2. **Credentials → Create credentials → OAuth client ID**, loại *Web application*.
3. **Authorized JavaScript origins**: `http://localhost:5173` và domain ngrok của từng thành viên.
4. Điền client ID vào cả `GOOGLE_CLIENT_ID` và `VITE_GOOGLE_CLIENT_ID`.

### Facebook

1. developers.facebook.com → **Create App** → use case *Authenticate and request data from users with Facebook Login*.
2. **App settings → Basic**: điền App Domains (domain ngrok), Privacy Policy URL, Data Deletion Instructions URL.
3. **Facebook Login → Settings**: thêm domain ngrok vào Allowed Domains for the JavaScript SDK.
4. Điền `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `VITE_FACEBOOK_APP_ID`.
5. Ở chế độ Development, chỉ tài khoản được thêm vào **App roles** mới đăng nhập được. Hãy thêm thành viên thứ hai vào đó.

Hai thành viên có thể dùng chung một Google project và một Facebook App: mỗi người chỉ cần thêm domain ngrok của mình vào danh sách.

## 6. Chạy app

```bash
pnpm dev                       # shared (watch), frontend :5173, backend :4000 chạy song song
ngrok http 5173 --url=palmsight-dev.ngrok-free.app
```

Vite dev server ở cổng 5173 proxy `/api/v1/*` sang API ở cổng 4000 (`API_PROXY_TARGET`). Vì vậy chỉ cần tunnel cổng 5173, và cookie `rt` dùng chung một domain. Mở `https://palmsight-dev.ngrok-free.app` trên điện thoại để thử camera.

Vite đọc `.env` ở thư mục gốc repo (`envDir: '..'`). Trình duyệt chỉ thấy các biến `VITE_*`. Đổi `.env` thì phải khởi động lại `pnpm dev`.

## 7. Lệnh thường dùng

| Lệnh | Việc |
| --- | --- |
| `pnpm dev` | Chạy shared + frontend + backend ở chế độ watch |
| `pnpm --filter frontend dev` / `pnpm --filter backend dev` | Chạy riêng một phía |
| `pnpm lint` / `pnpm typecheck` | Kiểm tra code |
| `pnpm test` | Unit + integration test (MongoDB chạy trong bộ nhớ) |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm --filter backend credits:adjust --user <id> --amount 5 --note "test"` | Cộng/trừ credits tay |
| `pnpm --filter backend credits:reconcile` | Kiểm tra sổ cái khớp số dư |
| `pnpm --filter backend db:check` | Kiểm tra dữ liệu mồ côi và tài khoản xoá chưa sạch (chỉ đọc) |
| `pnpm --filter backend users:delete --user <id> --note "<link yêu cầu>"` | Xoá tài khoản theo yêu cầu của người dùng ([ADR-0009](adr/0009-manual-account-deletion.md)) |
| `docker compose down -v` | Xoá sạch dữ liệu local |

Kể cả khi dev, đừng sửa tay `users` hay `credit_transactions` trong Compass để "test nhanh": dùng `db:seed`, `credits:adjust` hoặc API. Sửa tay sẽ tạo ra dữ liệu không thể có ngoài thực tế, và test trên dữ liệu đó không có ý nghĩa.

## Lỗi hay gặp

| Triệu chứng | Cách xử lý |
| --- | --- |
| `Transaction numbers are only allowed on a replica set member or mongos` | Thiếu `replicaSet=rs0` trong `MONGODB_URI`, hoặc replica set chưa được khởi tạo; chạy lại `docker compose up -d` |
| Mở qua ngrok báo "Blocked request. This host is not allowed" | Thêm domain ngrok vào `server.allowedHosts` của Vite |
| Mở thẳng `/scan` hoặc tải lại trang bị 404 khi chạy `vite preview` hay deploy | Thiếu SPA fallback về `/index.html`; trên Vercel xem `frontend/vercel.json` |
| `Cannot find module '@palmsight/shared'` | Chưa build `shared`; chạy `pnpm --filter @palmsight/shared build` hoặc `pnpm dev` |
| Gọi API qua ngrok nhận về trang HTML cảnh báo | Client gửi header `ngrok-skip-browser-warning: true` |
| Google báo `origin_mismatch` | Thêm đúng origin (kể cả `https://`) vào OAuth client |
| Facebook báo "App not active" | Thêm tài khoản vào App roles |
| Không thấy email xác minh khi dev | Mở Mailpit `http://localhost:8025`; kiểm tra `SMTP_HOST=localhost`, `SMTP_PORT=1025` |
| Gmail báo `535 Username and Password not accepted` | Dùng App Password, không dùng mật khẩu Gmail; tài khoản phải bật xác minh 2 bước |
| Link trong email trỏ về `localhost` khi mở trên điện thoại | Đặt `PUBLIC_BASE_URL` là domain ngrok rồi gửi lại email |
| Camera không mở trên điện thoại | Phải mở qua HTTPS (ngrok), không dùng địa chỉ IP trong mạng LAN |
| `AI_UNAVAILABLE` liên tục | Kiểm tra `GROQ_API_KEY`, tên model, hạn mức free tier |
