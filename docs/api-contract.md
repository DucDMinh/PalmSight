# api-contract — Đặc tả API

## Quy ước chung

- **Base URL**: `https://<domain>/api/v1`. Dev local expose qua ngrok: `https://<subdomain>.ngrok-free.app/api/v1`.
- **Body**: `application/json`, riêng `POST /readings` dùng `multipart/form-data`. Trường JSON dùng `camelCase`.
- **ID**: MongoDB ObjectId dạng chuỗi hex 24 ký tự, ví dụ `6710a1b2c3d4e5f6a7b8c9d0`.
- **Xác thực**: access token JWT (HS256, sống 15 phút) gửi qua `Authorization: Bearer <token>`. Refresh token nằm trong cookie `rt` (`HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`, 30 ngày), xoay vòng mỗi lần refresh.
- **Phân trang**: cursor — `?cursor=<opaque>&limit=20` (tối đa 50), trả về `{ "items": [...], "nextCursor": "..." | null }`.
- **Thời gian**: ISO 8601 UTC, ví dụ `2026-10-14T08:30:00Z`.

**Định dạng lỗi** — mọi lỗi 4xx/5xx có cùng dạng:

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Bạn không đủ credits để xem bói.",
    "details": { "required": 1, "balance": 0 }
  }
}
```

| `code` | HTTP | Khi nào |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body/query sai định dạng (kể cả `school` không hợp lệ); `details.fields` liệt kê trường lỗi |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | Thiếu header `Idempotency-Key` ở `POST /readings` |
| `UNAUTHENTICATED` | 401 | Thiếu hoặc sai access token |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn → client gọi `/auth/refresh` |
| `OAUTH_INVALID_TOKEN` | 401 | Token Google/Facebook không hợp lệ |
| `INSUFFICIENT_CREDITS` | 402 | Số dư < 1 khi xem bói |
| `NOT_FOUND` | 404 | Tài nguyên không tồn tại hoặc không thuộc về user |
| `REFERRAL_CODE_NOT_FOUND` | 404 | Mã giới thiệu không tồn tại |
| `REFERRAL_ALREADY_USED` | 409 | Tài khoản đã nhập mã trước đó |
| `IMAGE_TOO_LARGE` | 413 | Ảnh > 8 MB |
| `UNSUPPORTED_IMAGE_TYPE` | 415 | Không phải JPEG/PNG/WebP/HEIC |
| `REFERRAL_SELF` | 422 | Nhập mã của chính mình |
| `REFERRAL_CYCLE` | 422 | Nhập mã của người do mình giới thiệu |
| `RATE_LIMITED` | 429 | Vượt giới hạn; có header `Retry-After` |
| `AI_UNAVAILABLE` | 503 | Nhà cung cấp AI lỗi/hết quota; credit đã được hoàn |
| `INTERNAL_ERROR` | 500 | Lỗi không xác định; có `details.requestId` |

**Rate limit** (theo user, hoặc theo IP với API không cần đăng nhập; đếm trong bộ nhớ của API): `/auth/*` 10 req/phút/IP, `POST /me/referral` 5 req/giờ, `POST /readings` 5 req/phút, còn lại 60 req/phút.

## Endpoints

| Method | Path | Auth | Mô tả |
| --- | --- | --- | --- |
| POST | `/auth/google` | — | Đăng nhập bằng Google ID token |
| POST | `/auth/facebook` | — | Đăng nhập bằng Facebook access token |
| POST | `/auth/refresh` | cookie `rt` | Cấp access token mới |
| POST | `/auth/logout` | cookie `rt` | Thu hồi phiên |
| GET | `/health` | — | Kiểm tra kết nối MongoDB, dùng cho deploy |
| GET | `/me` | Bearer | Hồ sơ, số dư, mã giới thiệu |
| DELETE | `/me` | Bearer | Xoá tài khoản |
| POST | `/me/referral` | Bearer | Nhập mã giới thiệu |
| GET | `/me/referrals` | Bearer | Danh sách người mình đã giới thiệu |
| GET | `/me/credit-transactions` | Bearer | Lịch sử biến động credits |
| POST | `/readings` | Bearer | Gửi ảnh + trường phái + các mục muốn bói, trừ 1 credit, nhận kết quả |
| GET | `/readings` | Bearer | Lịch sử các lần xem |
| GET | `/readings/{id}` | Bearer | Chi tiết một lần xem |
| DELETE | `/readings/{id}` | Bearer | Xoá ảnh và kết quả |

Danh sách trường phái và các mục bói không có endpoint riêng: web đọc từ `@palmsight/shared` (`READING_SCHOOLS`, `LIFE_ASPECTS`).

### POST /auth/google · POST /auth/facebook

Client lấy token từ Google Identity Services hoặc Facebook Login SDK rồi gửi lên; server tự xác minh với provider. Nếu chưa có user tương ứng thì tạo mới và cộng `SIGNUP_BONUS`; nếu email đã xác minh trùng user có sẵn thì gộp vào user đó.

```json
// Request — /auth/google
{ "idToken": "eyJhbGciOiJSUzI1NiIs..." }

// Request — /auth/facebook
{ "accessToken": "EAAGm0PX4ZCps..." }

// 200 OK  (+ Set-Cookie: rt=...)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "isNewUser": true,
  "user": {
    "id": "6710a1b2c3d4e5f6a7b8c9d0",
    "displayName": "Nguyễn Văn A",
    "avatarUrl": "https://...",
    "creditBalance": 3,
    "referralCode": "K7QX4MZP"
  }
}
```

Lỗi: `OAUTH_INVALID_TOKEN`, `VALIDATION_ERROR`, `RATE_LIMITED`.

### POST /auth/refresh · POST /auth/logout

`/auth/refresh` không có body, trả `200 { "accessToken": "...", "expiresIn": 900 }` và cookie `rt` mới. `/auth/logout` trả `204` và xoá cookie.

### GET /health

Trả `200 { "status": "ok", "db": "ok" }`, hoặc `503` khi không kết nối được MongoDB; không gọi AI.

### GET /me · DELETE /me

```json
// GET /me — 200 OK
{
  "id": "6710a1b2c3d4e5f6a7b8c9d0",
  "displayName": "Nguyễn Văn A",
  "email": "a@example.com",
  "avatarUrl": "https://...",
  "creditBalance": 4,
  "referralCode": "K7QX4MZP",
  "referralLink": "https://<domain>/r/K7QX4MZP",
  "providers": ["GOOGLE"],
  "referral": {
    "canEnterCode": true,
    "enteredCode": null
  }
}
```

`DELETE /me` trả `204`. Server xoá ảnh, kết quả bói, mọi session và identity, rồi ẩn danh hoá user (xoá tên, email, avatar). `_id` và sổ cái credits được giữ lại để đối soát. Xem [security-privacy.md](security-privacy.md#xoá-tài-khoản).

### POST /me/referral

Nhập được bất cứ lúc nào, mỗi tài khoản một lần. Trả `201` khi mã được ghi nhận, kể cả khi chủ mã đã hết lượt thưởng trong ngày (`CAPPED`).

```json
// Request
{ "code": "K7QX4MZP" }

// 201 Created
{ "accepted": true, "referrer": { "displayName": "Trần B" } }
```

Lỗi: `REFERRAL_CODE_NOT_FOUND`, `REFERRAL_SELF`, `REFERRAL_ALREADY_USED`, `REFERRAL_CYCLE`, `RATE_LIMITED`.

### GET /me/referrals

```json
// 200 OK
{
  "totalRewarded": 3,
  "totalCreditsEarned": 6,
  "items": [
    { "displayName": "Lê C***", "status": "REWARDED", "creditsEarned": 2, "createdAt": "2026-10-12T02:10:00Z" },
    { "displayName": "Phạm D***", "status": "CAPPED", "creditsEarned": 0, "createdAt": "2026-10-13T09:00:00Z" }
  ],
  "nextCursor": null
}
```

Tên người được giới thiệu bị che một phần.

### GET /me/credit-transactions

```json
// 200 OK
{
  "items": [
    { "id": "6710c3d4e5f6a7b8c9d0e1f2", "type": "READING_SPEND", "amount": -1, "balanceAfter": 4, "readingId": "6710c3d4e5f6a7b8c9d0e1aa", "createdAt": "2026-10-14T08:31:02Z" },
    { "id": "6710b2c3d4e5f6a7b8c9d0e1", "type": "REFERRAL_BONUS", "amount": 2, "balanceAfter": 5, "createdAt": "2026-10-12T02:10:00Z" },
    { "id": "6710a1b2c3d4e5f6a7b8c9d1", "type": "SIGNUP_BONUS", "amount": 3, "balanceAfter": 3, "createdAt": "2026-10-10T07:00:00Z" }
  ],
  "nextCursor": null
}
```

### POST /readings

Xử lý đồng bộ, timeout phía server 45 giây. Header bắt buộc `Idempotency-Key: <uuid do client sinh>`.

| Field (multipart) | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `image` | file | có | JPEG/PNG/WebP/HEIC, ≤ 8 MB |
| `school` | `WESTERN` \| `EASTERN` \| `VEDIC` | có | Trường phái bói, xem [ai-integration.md](ai-integration.md#trường-phái-bói) |
| `topics` | string | không | Các mục muốn bói, cách nhau bởi dấu phẩy, ví dụ `nguHanh,thienVan,love`. Bỏ trống = **bói toàn bộ**. Xem [ai-integration.md](ai-integration.md#chọn-mục-bói) |
| `hand` | `LEFT` \| `RIGHT` | không | Người dùng tự chọn tay; bỏ trống thì AI đoán |

Giá luôn là 1 credit, dù chọn bao nhiêu mục. Mục không thuộc trường phái đã chọn → `400 VALIDATION_ERROR`, không trừ credit.

```json
// 200 OK — bói thành công
{
  "reading": {
    "id": "6710c3d4e5f6a7b8c9d0e1aa",
    "status": "DONE",
    "school": "EASTERN",
    "topics": ["nguHanh", "thienVan", "love"],
    "hand": "LEFT",
    "result": { "...": "PalmResult, xem ai-integration.md" },
    "createdAt": "2026-10-14T08:31:00Z"
  },
  "creditBalance": 3
}

// 200 OK — ảnh không phải lòng bàn tay, credit đã hoàn
{
  "reading": {
    "id": "6710c3d4e5f6a7b8c9d0e1ab",
    "status": "REJECTED",
    "school": "EASTERN",
    "rejectReason": "Không nhìn rõ lòng bàn tay. Hãy chụp lại nơi đủ sáng."
  },
  "creditBalance": 4
}
```

Lỗi: `VALIDATION_ERROR`, `IDEMPOTENCY_KEY_REQUIRED`, `INSUFFICIENT_CREDITS`, `IMAGE_TOO_LARGE`, `UNSUPPORTED_IMAGE_TYPE`, `RATE_LIMITED`, `AI_UNAVAILABLE` (credit đã hoàn).

### GET /readings · GET /readings/{id} · DELETE /readings/{id}

- `GET /readings` trả danh sách rút gọn `{ id, status, school, topics, hand, summary, thumbnailUrl, createdAt }`.
- `GET /readings/{id}` trả đầy đủ `result` và `imageUrl`. `imageUrl` là signed URL sống 5 phút, hoặc `null` nếu ảnh đã bị xoá.
- `DELETE /readings/{id}` xoá file ảnh trong storage, đặt `result = null`, trả `204`. Không hoàn credit.
