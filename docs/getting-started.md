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

Chuỗi kết nối trong `.env`:

```bash
MONGODB_URI=mongodb://localhost:27017/palmsight?replicaSet=rs0&directConnection=true
```

## 4. Tạo index và dữ liệu mẫu

```bash
pnpm --filter api db:sync-indexes    # tạo index + validator theo schema
pnpm --filter api db:seed            # vài user mẫu có sẵn credits
```

## 5. Lấy API key và cấu hình đăng nhập

### ngrok (làm trước, vì đăng nhập Facebook cần URL HTTPS)

1. Đăng ký tại ngrok.com, copy authtoken vào `NGROK_AUTHTOKEN`, chạy `ngrok config add-authtoken <token>`.
2. Dashboard → **Domains** → nhận static domain miễn phí, ví dụ `palmsight-dev.ngrok-free.app`. Mỗi thành viên nên có domain riêng.
3. Đặt `PUBLIC_BASE_URL=https://palmsight-dev.ngrok-free.app`.

### Groq

1. Tạo key tại console.groq.com → **API Keys**, điền `GROQ_API_KEY`.
2. Kiểm tra trang **Models**, chọn một model hỗ trợ ảnh (vision), điền `AI_MODEL`.

### Google

1. console.cloud.google.com → tạo project → **APIs & Services → OAuth consent screen**, loại External, thêm email của 2 thành viên làm test user.
2. **Credentials → Create credentials → OAuth client ID**, loại *Web application*.
3. **Authorized JavaScript origins**: `http://localhost:3000` và domain ngrok của từng thành viên.
4. Điền client ID vào cả `GOOGLE_CLIENT_ID` và `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Facebook

1. developers.facebook.com → **Create App** → use case *Authenticate and request data from users with Facebook Login*.
2. **App settings → Basic**: điền App Domains (domain ngrok), Privacy Policy URL, Data Deletion Instructions URL.
3. **Facebook Login → Settings**: thêm domain ngrok vào Allowed Domains for the JavaScript SDK.
4. Điền `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `NEXT_PUBLIC_FACEBOOK_APP_ID`.
5. Ở chế độ Development, chỉ tài khoản được thêm vào **App roles** mới đăng nhập được. Hãy thêm thành viên thứ hai vào đó.

Hai thành viên có thể dùng chung một Google project và một Facebook App: mỗi người chỉ cần thêm domain ngrok của mình vào danh sách.

## 6. Chạy app

```bash
pnpm dev                       # web :3000, api :4000 chạy song song
ngrok http 3000 --url=palmsight-dev.ngrok-free.app
```

Web ở cổng 3000 rewrite `/api/v1/*` sang API ở cổng 4000. Vì vậy chỉ cần tunnel cổng 3000, và cookie `rt` dùng chung một domain. Mở `https://palmsight-dev.ngrok-free.app` trên điện thoại để thử camera.

## 7. Lệnh thường dùng

| Lệnh | Việc |
| --- | --- |
| `pnpm dev` | Chạy web + api ở chế độ watch |
| `pnpm lint` / `pnpm typecheck` | Kiểm tra code |
| `pnpm test` | Unit + integration test (MongoDB chạy trong bộ nhớ) |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm --filter api credits:adjust --user <id> --amount 5 --note "test"` | Cộng/trừ credits tay |
| `pnpm --filter api credits:reconcile` | Kiểm tra sổ cái khớp số dư |
| `docker compose down -v` | Xoá sạch dữ liệu local |

## Lỗi hay gặp

| Triệu chứng | Cách xử lý |
| --- | --- |
| `Transaction numbers are only allowed on a replica set member or mongos` | Thiếu `replicaSet=rs0` trong `MONGODB_URI`, hoặc replica set chưa được khởi tạo; chạy lại `docker compose up -d` |
| Gọi API qua ngrok nhận về trang HTML cảnh báo | Client gửi header `ngrok-skip-browser-warning: true` |
| Google báo `origin_mismatch` | Thêm đúng origin (kể cả `https://`) vào OAuth client |
| Facebook báo "App not active" | Thêm tài khoản vào App roles |
| Camera không mở trên điện thoại | Phải mở qua HTTPS (ngrok), không dùng địa chỉ IP trong mạng LAN |
| `AI_UNAVAILABLE` liên tục | Kiểm tra `GROQ_API_KEY`, tên model, hạn mức free tier |
