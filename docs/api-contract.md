# api-contract — Đặc tả API

## Quy ước chung

- **Base URL**: `https://<domain>/api/v1`. Web và API chạy chung một domain: khi dev qua Vite proxy (`https://<subdomain>.ngrok-free.app/api/v1`), khi deploy qua Vercel rewrite. Xem [deployment.md](deployment.md#định-tuyến).
- **ID**: MongoDB ObjectId dạng chuỗi hex 24 ký tự, ví dụ `6710a1b2c3d4e5f6a7b8c9d0`.
- **Thời gian**: ISO 8601 UTC, ví dụ `2026-10-14T08:30:00Z`.
- **Tên trường**: JSON và multipart đều dùng `camelCase`.

### Giá trị gửi lên nằm ở đâu

| Vị trí | Dùng cho | Quy tắc |
| --- | --- | --- |
| **Path** | ID tài nguyên: `/readings/{id}` | ObjectId sai định dạng được xử lý như không tồn tại → `404 NOT_FOUND` |
| **Query** | Chỉ dùng cho `GET`: phân trang `cursor`, `limit` | Request `POST`/`DELETE` **không** đọc query; tham số trên query bị bỏ qua |
| **Header** | `Authorization` (access token), `Idempotency-Key` (chỉ `POST /readings`) | Xem bảng header bên dưới |
| **Cookie** | Refresh token `rt`, chỉ dùng ở `/auth/*` | Trình duyệt tự gửi; client không đọc được (HttpOnly) |
| **Body JSON** | `POST /auth/google`, `POST /auth/facebook`, `POST /me/referral` | `Content-Type: application/json`. Có trường lạ hoặc thiếu trường bắt buộc → `400 VALIDATION_ERROR` |
| **Body multipart** | Chỉ `POST /readings` (có file ảnh) | `Content-Type: multipart/form-data`. Mọi giá trị không phải file đều là chuỗi |
| **Không có body** | `POST /auth/refresh`, `POST /auth/logout`, mọi `GET` và `DELETE` | Body gửi kèm (nếu có) bị bỏ qua |

Tóm tắt các request `POST`:

| Endpoint | Path | Query | Header | Cookie | Body |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/google` | — | — | — | `rt` (nếu có) | JSON `{ idToken }` |
| `POST /auth/facebook` | — | — | — | `rt` (nếu có) | JSON `{ accessToken }` |
| `POST /auth/refresh` | — | — | `Origin` | `rt` (bắt buộc) | — |
| `POST /auth/logout` | — | — | `Origin` | `rt` (nếu có) | — |
| `POST /me/referral` | — | — | `Authorization` | — | JSON `{ code }` |
| `POST /readings` | — | — | `Authorization`, `Idempotency-Key` | — | multipart `school`, `topics`, `hand`, `aiConsent`, `image` |

### Header

| Header | Chiều | Khi nào | Giá trị |
| --- | --- | --- | --- |
| `Authorization` | request | Mọi endpoint cần đăng nhập | `Bearer <accessToken>` |
| `Content-Type` | request | Request có body | `application/json`, hoặc `multipart/form-data; boundary=...`. Với multipart, để trình duyệt tự đặt, **không** tự ghi tay (sẽ thiếu `boundary`) |
| `Idempotency-Key` | request | `POST /readings` | UUID v4 do client sinh (`crypto.randomUUID()`), 36 ký tự |
| `Origin` | request | `/auth/refresh`, `/auth/logout` | Trình duyệt tự gửi; phải khớp `PUBLIC_BASE_URL` |
| `ngrok-skip-browser-warning` | request | Chỉ khi dev qua ngrok | `true` |
| `X-Request-Id` | response | Mọi response | ID để tra log; trùng `details.requestId` của lỗi 500 |
| `Retry-After` | response | `429` | Số giây cần chờ |
| `Idempotent-Replayed` | response | `POST /readings` trả lại kết quả cũ | `true` |
| `Set-Cookie` | response | Đăng nhập, refresh, logout, xoá tài khoản | Cookie `rt` |

### Xác thực

- **Access token**: JWT HS256, sống 15 phút. Server trả trong body (`accessToken`, `expiresIn`). Client giữ trong bộ nhớ, không lưu `localStorage`, và gửi qua header `Authorization`.
- **Refresh token**: cookie `rt` với thuộc tính `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=2592000` (30 ngày). Xoay vòng mỗi lần refresh. Vì `Path=/api/v1/auth`, cookie chỉ được gửi tới các endpoint `/auth/*`.
- Khi mở app hoặc tải lại trang: gọi `POST /auth/refresh`. Nếu `200` thì đã đăng nhập; nếu `401` thì chuyển tới `/login`.
- Gặp `401 TOKEN_EXPIRED`: gọi `/auth/refresh` rồi gửi lại request ban đầu **một lần**. Gặp `401 UNAUTHENTICATED`: chuyển tới `/login`.
- **Nhiều tab**: các tab dùng chung cookie `rt`. Nếu hai tab refresh cùng lúc, tab gửi sau sẽ bị coi là dùng lại token cũ, và mọi phiên bị thu hồi. Vì vậy client bọc lời gọi refresh trong `navigator.locks.request("palmsight-refresh", ...)`, để mỗi lúc chỉ một tab refresh.

### Phân trang

Áp dụng cho `GET /me/referrals`, `GET /me/credit-transactions`, `GET /readings`.

| Query | Kiểu | Mặc định | Ràng buộc |
| --- | --- | --- | --- |
| `cursor` | string | — | Chuỗi opaque lấy từ `nextCursor` của trang trước; bỏ trống = trang đầu. Cursor sai → `400 VALIDATION_ERROR` |
| `limit` | int | 20 | 1–50 |

Response có dạng `{ "items": [...], "nextCursor": "..." | null }`. Khi `nextCursor` là `null` thì đã hết dữ liệu. Danh sách luôn sắp mới nhất trước.

### Định dạng lỗi

Mọi lỗi 4xx/5xx có cùng dạng:

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Bạn không đủ credits để xem bói.",
    "details": { "required": 1, "balance": 0 }
  }
}
```

`message` viết bằng tiếng Việt và có thể hiển thị thẳng cho người dùng. Client rẽ nhánh theo `code`, không theo `message`.

Với `VALIDATION_ERROR`, `details.fields` liệt kê từng trường lỗi. `field` là tên trường trong body, tên query, hoặc tên header:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu gửi lên không hợp lệ.",
    "details": {
      "fields": [
        { "field": "school", "message": "Phải là WESTERN, EASTERN hoặc VEDIC" },
        { "field": "Idempotency-Key", "message": "Phải là UUID" }
      ]
    }
  }
}
```

| `code` | HTTP | Khi nào |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body, query hoặc header sai định dạng, thiếu trường bắt buộc, hoặc có trường lạ; `details.fields` liệt kê trường lỗi |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | Thiếu header `Idempotency-Key` ở `POST /readings` |
| `UNAUTHENTICATED` | 401 | Thiếu hoặc sai access token; hoặc cookie `rt` thiếu, sai, hết hạn, đã thu hồi |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn → client gọi `/auth/refresh` |
| `OAUTH_INVALID_TOKEN` | 401 | Token Google/Facebook không hợp lệ |
| `INSUFFICIENT_CREDITS` | 402 | Số dư < 1 khi xem bói |
| `ORIGIN_NOT_ALLOWED` | 403 | Header `Origin` không khớp `PUBLIC_BASE_URL` ở `/auth/refresh`, `/auth/logout` |
| `NOT_FOUND` | 404 | Tài nguyên không tồn tại, đã xoá, hoặc không thuộc về user |
| `REFERRAL_CODE_NOT_FOUND` | 404 | Mã giới thiệu không tồn tại hoặc sai định dạng |
| `REFERRAL_ALREADY_USED` | 409 | Tài khoản đã nhập mã trước đó |
| `READING_IN_PROGRESS` | 409 | Reading đang `PROCESSING`: gửi lại cùng `Idempotency-Key`, hoặc xoá reading đang xử lý |
| `IMAGE_TOO_LARGE` | 413 | Ảnh > 8 MB |
| `UNSUPPORTED_IMAGE_TYPE` | 415 | Nội dung file không phải JPEG/PNG/WebP/HEIC |
| `REFERRAL_SELF` | 422 | Nhập mã của chính mình |
| `REFERRAL_CYCLE` | 422 | Nhập mã của người do mình giới thiệu |
| `RATE_LIMITED` | 429 | Vượt giới hạn; có header `Retry-After` |
| `AI_UNAVAILABLE` | 503 | Nhà cung cấp AI lỗi, hết quota hoặc timeout; credit đã được hoàn |
| `INTERNAL_ERROR` | 500 | Lỗi không xác định; có `details.requestId` |

**Rate limit** đếm trong bộ nhớ của API. Endpoint cần đăng nhập đếm theo user; endpoint không cần đăng nhập đếm theo IP.

| Endpoint | Giới hạn |
| --- | --- |
| `/auth/*` | 10 request/phút/IP |
| `POST /me/referral` | 5 request/giờ/user |
| `POST /readings` | 5 request/phút/user, kể cả request trả lại kết quả cũ |
| Còn lại | 60 request/phút |

## Endpoints

| Method | Path | Auth | Đầu vào | Mô tả |
| --- | --- | --- | --- | --- |
| POST | `/auth/google` | — | body JSON | Đăng nhập bằng Google ID token |
| POST | `/auth/facebook` | — | body JSON | Đăng nhập bằng Facebook access token |
| POST | `/auth/refresh` | cookie `rt` | — | Cấp access token mới |
| POST | `/auth/logout` | cookie `rt` | — | Thu hồi phiên |
| GET | `/health` | — | — | Kiểm tra kết nối MongoDB, dùng cho deploy |
| GET | `/me` | Bearer | — | Hồ sơ, số dư, mã giới thiệu |
| DELETE | `/me` | Bearer | — | Xoá tài khoản |
| POST | `/me/referral` | Bearer | body JSON | Nhập mã giới thiệu |
| GET | `/me/referrals` | Bearer | query phân trang | Danh sách người mình đã giới thiệu |
| GET | `/me/credit-transactions` | Bearer | query phân trang | Lịch sử biến động credits |
| POST | `/readings` | Bearer | header + body multipart | Gửi ảnh + trường phái + các mục muốn bói, trừ 1 credit, nhận kết quả |
| GET | `/readings` | Bearer | query phân trang | Lịch sử các lần xem |
| GET | `/readings/{id}` | Bearer | path | Chi tiết một lần xem |
| DELETE | `/readings/{id}` | Bearer | path | Xoá ảnh và kết quả, ẩn khỏi lịch sử |

Danh sách trường phái và các mục bói không có endpoint riêng: web đọc từ `@palmsight/shared` (`READING_SCHOOLS`, `LIFE_ASPECTS`).

### POST /auth/google · POST /auth/facebook

Client lấy token từ Google Identity Services hoặc Facebook Login SDK, rồi gửi lên trong **body JSON**. Server tự xác minh token với provider.

- Chưa có user tương ứng → tạo user mới và cộng `SIGNUP_BONUS`.
- Email đã xác minh trùng với user có sẵn → gộp vào user đó.

Luồng chi tiết ở [workflow.md](workflow.md#1-đăng-nhập-google--facebook).

**Request**

| Endpoint | Vị trí | Trường | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- | --- | --- |
| `/auth/google` | body | `idToken` | string | có | Giá trị `credential` mà GIS trả về; 1–4096 ký tự |
| `/auth/facebook` | body | `accessToken` | string | có | `authResponse.accessToken` mà Facebook SDK trả về; 1–4096 ký tự |
| cả hai | cookie | `rt` | — | không | Nếu đang có phiên cũ trên trình duyệt này, server thu hồi phiên đó trước khi cấp phiên mới |

```http
POST /api/v1/auth/google
Content-Type: application/json

{ "idToken": "eyJhbGciOiJSUzI1NiIs..." }
```

```http
POST /api/v1/auth/facebook
Content-Type: application/json

{ "accessToken": "EAAGm0PX4ZCps..." }
```

**Response**

```json
// 200 OK
// Set-Cookie: rt=<refresh token>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=2592000
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

`isNewUser = true` chỉ khi request này tạo user mới, kể cả user tạo lại sau khi đã xoá tài khoản. Gộp identity vào user cũ thì `isNewUser = false`.

Lỗi: `VALIDATION_ERROR`, `OAUTH_INVALID_TOKEN`, `RATE_LIMITED`.

### POST /auth/refresh

Không có body. Trình duyệt tự gửi cookie `rt` (cùng domain) và header `Origin`.

| Vị trí | Trường | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- |
| cookie | `rt` | có | Refresh token còn hạn, chưa thu hồi |
| header | `Origin` | có | Khớp `PUBLIC_BASE_URL` |

```json
// 200 OK
// Set-Cookie: rt=<refresh token mới>; ...
{ "accessToken": "eyJhbGciOiJIUzI1NiIs...", "expiresIn": 900 }
```

| Trường hợp | Response |
| --- | --- |
| Thiếu cookie, token sai, hết hạn hoặc đã thu hồi | `401 UNAUTHENTICATED`, xoá cookie `rt` |
| Token đã bị xoay vòng mà vẫn được dùng lại (dấu hiệu bị lộ) | Thu hồi **mọi** phiên của user, `401 UNAUTHENTICATED`, xoá cookie `rt` |
| `Origin` sai | `403 ORIGIN_NOT_ALLOWED` |

Lỗi: `UNAUTHENTICATED`, `ORIGIN_NOT_ALLOWED`, `RATE_LIMITED`.

### POST /auth/logout

Không có body. Cookie `rt` không bắt buộc. Có cookie thì server thu hồi phiên tương ứng; không có thì không làm gì.

Luôn trả `204` và xoá cookie (`Set-Cookie: rt=; Max-Age=0; Path=/api/v1/auth`). Client xoá access token trong bộ nhớ.

Lỗi: `ORIGIN_NOT_ALLOWED`, `RATE_LIMITED`.

### GET /health

Không cần đăng nhập. Trả `200 { "status": "ok", "db": "ok" }`, hoặc `503` khi không kết nối được MongoDB. Không gọi AI.

### GET /me

```json
// 200 OK
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

| Trường | Ghi chú |
| --- | --- |
| `email` | `null` nếu Facebook không trả email |
| `providers` | Các cách đăng nhập đã liên kết: `GOOGLE`, `FACEBOOK` |
| `referral.canEnterCode` | `true` khi user chưa từng nhập mã |
| `referral.enteredCode` | Mã đã nhập, hoặc `null` |

### DELETE /me

Không có body. Chỉ cần header `Authorization`.

Server lần lượt:

1. Xoá mọi ảnh trong storage của user.
2. Xoá kết quả bói.
3. Thu hồi mọi session.
4. Xoá identity, rồi ẩn danh hoá user (xoá tên, email, avatar, đặt `deletedAt`).

`_id`, sổ cái credits và các document `referrals` được giữ lại để đối soát. Server trả `204` và xoá cookie `rt`. Xem [security-privacy.md](security-privacy.md#xoá-tài-khoản).

Sau khi xoá, đăng nhập lại bằng cùng Google/Facebook sẽ tạo **user mới**: nhận `SIGNUP_BONUS` và được nhập mã giới thiệu lại. Hành vi này được chấp nhận, xem [business-rules.md](business-rules.md#quy-tắc-credits).

### POST /me/referral

Nhập được bất cứ lúc nào, mỗi tài khoản một lần. Mã nằm trong **body JSON**.

| Vị trí | Trường | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- | --- |
| header | `Authorization` | — | có | |
| body | `code` | string | có | Server bỏ khoảng trắng hai đầu và đổi sang chữ in hoa trước khi kiểm tra. Mã sau chuẩn hoá phải khớp `^[A-HJKMNP-Z2-9]{8}$`; không khớp → `404 REFERRAL_CODE_NOT_FOUND` |

```http
POST /api/v1/me/referral
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{ "code": "k7qx4mzp" }
```

```json
// 201 Created
{ "accepted": true, "referrer": { "displayName": "Trần B" } }
```

Server trả `201` khi mã được ghi nhận, kể cả khi chủ mã đã hết lượt thưởng trong ngày (`CAPPED`). Response không cho người nhập biết chủ mã có được cộng hay không. Thứ tự kiểm tra theo [business-rules.md](business-rules.md#kiểm-tra-khi-nhập-mã-giới-thiệu). Mã của tài khoản đã xoá được coi là không tồn tại.

Lỗi: `VALIDATION_ERROR` (thiếu `code` hoặc `code` không phải chuỗi), `REFERRAL_CODE_NOT_FOUND`, `REFERRAL_SELF`, `REFERRAL_ALREADY_USED`, `REFERRAL_CYCLE`, `RATE_LIMITED`.

### GET /me/referrals

Query: `cursor`, `limit` (xem [Phân trang](#phân-trang)).

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

- Tên người được giới thiệu bị che một phần.
- Người được giới thiệu đã xoá tài khoản hiện là `"Người dùng đã xoá"`.
- `totalRewarded` và `totalCreditsEarned` tính trên toàn bộ danh sách, không chỉ trang hiện tại.

### GET /me/credit-transactions

Query: `cursor`, `limit`.

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

`readingId` chỉ có với `READING_SPEND`/`READING_REFUND`; `note` chỉ có với `ADMIN_ADJUST`. Giao dịch của reading đã xoá vẫn hiện, nhưng `readingId` của nó mở ra `404`.

### POST /readings

Xử lý đồng bộ, timeout phía server 45 giây. Client đặt timeout **60 giây**, dài hơn server, để không tự huỷ request trước khi server trả lời.

**Header**

| Header | Bắt buộc | Ràng buộc |
| --- | --- | --- |
| `Authorization` | có | `Bearer <accessToken>` |
| `Idempotency-Key` | có | UUID v4, 36 ký tự. Thiếu → `400 IDEMPOTENCY_KEY_REQUIRED`; sai định dạng → `400 VALIDATION_ERROR` |
| `Content-Type` | có | `multipart/form-data; boundary=...`, do trình duyệt tự đặt khi gửi `FormData` |

**Body (multipart/form-data)**: mỗi trường là một part. Không dùng query, không dùng JSON.

| Part | Kiểu | Bắt buộc | Ràng buộc |
| --- | --- | --- | --- |
| `school` | text | có | `WESTERN` \| `EASTERN` \| `VEDIC`. Xem [ai-integration.md](ai-integration.md#trường-phái-bói) |
| `topics` | text | không | Các key cách nhau bởi dấu phẩy, không có khoảng trắng, ví dụ `nguHanh,thienVan,love`. Thiếu part này hoặc chuỗi rỗng = **bói toàn bộ**. Mỗi key phải là mục riêng của `school` đã chọn hoặc một khía cạnh trong `LIFE_ASPECTS`. Server bỏ trùng và sắp lại theo thứ tự chuẩn. Xem [ai-integration.md](ai-integration.md#chọn-mục-bói) |
| `hand` | text | có | `LEFT` \| `RIGHT`, do người dùng chọn ở bước 3. Đây là giá trị cuối cùng: server ghi đè `result.hand` bằng giá trị này |
| `aiConsent` | text | có | Phải là `true`: người dùng đã tích đồng ý gửi ảnh cho nhà cung cấp AI. Giá trị khác → `400 VALIDATION_ERROR` |
| `image` | file | có | Đúng 1 file, ≤ 8 MB, nội dung JPEG/PNG/WebP/HEIC (kiểm tra bằng magic bytes, không tin `Content-Type` của part). Tên file bị bỏ qua |

Part lạ hoặc gửi nhiều hơn 1 file → `400 VALIDATION_ERROR`. Nên append part `image` **cuối cùng**, để server đọc các trường text trước file.

```ts
const form = new FormData();
form.append("school", "EASTERN");
form.append("topics", "nguHanh,thienVan,love"); // bỏ dòng này = bói toàn bộ
form.append("hand", "LEFT");
form.append("aiConsent", "true");
form.append("image", file); // File/Blob từ camera hoặc <input type="file">

await api.post("/readings", form, {
  headers: { "Idempotency-Key": idempotencyKey }, // không tự đặt Content-Type
  timeout: 60_000,
});
```

```http
POST /api/v1/readings
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Idempotency-Key: 3f6c2a9e-8b1d-4c7a-9e2f-5d4b3a2c1e0f
Content-Type: multipart/form-data; boundary=----palm

------palm
Content-Disposition: form-data; name="school"

EASTERN
------palm
Content-Disposition: form-data; name="topics"

nguHanh,thienVan,love
------palm
Content-Disposition: form-data; name="hand"

LEFT
------palm
Content-Disposition: form-data; name="aiConsent"

true
------palm
Content-Disposition: form-data; name="image"; filename="palm.jpg"
Content-Type: image/jpeg

<dữ liệu nhị phân>
------palm--
```

**Thứ tự xử lý phía server**

| # | Bước | Thất bại thì | Trừ credit? |
| --- | --- | --- | --- |
| 1 | Xác thực access token | `401` | Không |
| 2 | Rate limit | `429 RATE_LIMITED` | Không |
| 3 | Kiểm tra header `Idempotency-Key` | `400 IDEMPOTENCY_KEY_REQUIRED` / `VALIDATION_ERROR` | Không |
| 4 | Tìm reading cùng `(userId, Idempotency-Key)` | Có rồi → trả theo bảng **Gửi lại cùng key** bên dưới, bỏ qua các bước sau | Không |
| 5 | Đọc multipart: kích thước ảnh | `413 IMAGE_TOO_LARGE` | Không |
| 6 | Validate `school`, `topics`, `hand`, `aiConsent` | `400 VALIDATION_ERROR` | Không |
| 7 | Kiểm tra loại ảnh bằng magic bytes | `415 UNSUPPORTED_IMAGE_TYPE` | Không |
| 8 | Trừ 1 credit + tạo reading `PROCESSING` trong 1 transaction | `402 INSUFFICIENT_CREDITS` | — |
| 9 | Xử lý ảnh, lưu storage, gọi AI | `REJECTED` → `200`; `FAILED` → `503`; cả hai đều hoàn credit | Có, rồi hoàn |
| 10 | Lưu kết quả | `DONE` → `200` | Có |

Ở bước 5, multer có thể dừng đọc và trả `413` ngay khi luồng upload vượt 8 MB.

**Response**

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
    "createdAt": "2026-10-14T08:31:00Z",
    "completedAt": "2026-10-14T08:31:07Z"
  },
  "creditBalance": 3
}

// 200 OK — ảnh không phải lòng bàn tay, credit đã hoàn
{
  "reading": {
    "id": "6710c3d4e5f6a7b8c9d0e1ab",
    "status": "REJECTED",
    "school": "EASTERN",
    "topics": ["nguHanh", "thienVan", "love"],
    "hand": "LEFT",
    "rejectReason": "Không nhìn rõ lòng bàn tay. Hãy chụp lại nơi đủ sáng.",
    "result": null,
    "createdAt": "2026-10-14T08:31:00Z",
    "completedAt": "2026-10-14T08:31:05Z"
  },
  "creditBalance": 4
}

// 503 Service Unavailable — AI lỗi, credit đã hoàn
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "Hệ thống bận, đã hoàn 1 credit. Thử lại sau ít phút.",
    "details": { "readingId": "6710c3d4e5f6a7b8c9d0e1ac", "refunded": true, "creditBalance": 4 }
  }
}

// 409 Conflict — gửi lại cùng key khi reading trước vẫn đang xử lý
{
  "error": {
    "code": "READING_IN_PROGRESS",
    "message": "Lần xem bói trước vẫn đang xử lý.",
    "details": { "readingId": "6710c3d4e5f6a7b8c9d0e1ad" }
  }
}
```

`creditBalance` là số dư **sau** khi xử lý xong. Client dùng giá trị này cập nhật số credits trên màn hình.

**Idempotency-Key — quy tắc cho client**

| Tình huống | Key dùng cho lần gửi tiếp theo |
| --- | --- |
| Không nhận được response: mất mạng, client timeout, tab bị treo | **Cùng** key: gửi lại an toàn, không bị trừ thêm |
| Đã nhận response bất kỳ (`200`, `4xx`, `503`) | Key **mới** cho lần bấm "Xem bói" tiếp theo |
| Người dùng đổi ảnh, trường phái, mục bói hoặc tay | Key **mới** |

Client sinh key khi người dùng bấm **Xem bói**, giữ key trong bộ nhớ cho tới khi nhận được response, rồi bỏ key đó.

**Gửi lại cùng key**: server chỉ so khớp key, **không** so sánh nội dung body. Body của lần gửi lại bị bỏ qua.

| Trạng thái reading đã có | Response | Header |
| --- | --- | --- |
| `PROCESSING` | `409 READING_IN_PROGRESS` với `details.readingId`. Client đợi vài giây rồi gọi `GET /readings/{readingId}` cho tới khi trạng thái khác `PROCESSING` | |
| `DONE`, `REJECTED` | `200`, cùng dạng với lần đầu; `creditBalance` là số dư hiện tại | `Idempotent-Replayed: true` |
| `FAILED` | `503 AI_UNAVAILABLE`, cùng `details` với lần đầu; `creditBalance` là số dư hiện tại | `Idempotent-Replayed: true` |
| Reading đã bị xoá | `404 NOT_FOUND` | |

Lỗi: `VALIDATION_ERROR`, `IDEMPOTENCY_KEY_REQUIRED`, `INSUFFICIENT_CREDITS`, `READING_IN_PROGRESS`, `IMAGE_TOO_LARGE`, `UNSUPPORTED_IMAGE_TYPE`, `RATE_LIMITED`, `AI_UNAVAILABLE` (credit đã hoàn).

### GET /readings

Query: `cursor`, `limit`. Trả mọi reading **chưa bị xoá** của user, ở mọi trạng thái, mới nhất trước.

```json
// 200 OK
{
  "items": [
    {
      "id": "6710c3d4e5f6a7b8c9d0e1aa",
      "status": "DONE",
      "school": "EASTERN",
      "topics": ["nguHanh", "thienVan", "love"],
      "hand": "LEFT",
      "summary": "Tay Thổ, thực tế và đáng tin cậy...",
      "thumbnailUrl": "https://<r2>/readings/...jpg?X-Amz-Signature=...",
      "createdAt": "2026-10-14T08:31:00Z"
    },
    {
      "id": "6710c3d4e5f6a7b8c9d0e1ac",
      "status": "FAILED",
      "school": "WESTERN",
      "topics": ["heartLine"],
      "hand": "RIGHT",
      "summary": null,
      "thumbnailUrl": "https://...",
      "createdAt": "2026-10-13T10:02:00Z"
    }
  ],
  "nextCursor": null
}
```

| Trường | Ghi chú |
| --- | --- |
| `summary` | Chỉ có khi `DONE`; trạng thái khác là `null` |
| `thumbnailUrl` | Signed URL 5 phút trỏ tới chính ảnh đã lưu (cạnh dài 1280 px; MVP chưa có ảnh thu nhỏ riêng). `null` khi ảnh đã hết hạn 90 ngày hoặc chưa lưu được |

Khi đọc danh sách, reading kẹt `PROCESSING` quá 2 phút được chuyển sang `FAILED` và hoàn credit trước khi trả về. Xem [workflow.md](workflow.md#3-xem-bói).

### GET /readings/{id}

Path: `id` là ObjectId của reading. ID sai định dạng, không tồn tại, đã xoá, hoặc thuộc user khác → `404 NOT_FOUND`.

```json
// 200 OK
{
  "id": "6710c3d4e5f6a7b8c9d0e1aa",
  "status": "DONE",
  "school": "EASTERN",
  "topics": ["nguHanh", "thienVan", "love"],
  "hand": "LEFT",
  "result": { "...": "PalmResult" },
  "rejectReason": null,
  "imageUrl": "https://<r2>/readings/...jpg?X-Amz-Signature=...",
  "createdAt": "2026-10-14T08:31:00Z",
  "completedAt": "2026-10-14T08:31:07Z"
}
```

| Trạng thái | `result` | `rejectReason` | `completedAt` |
| --- | --- | --- | --- |
| `PROCESSING` | `null` | `null` | `null` |
| `DONE` | `PalmResult` | `null` | có |
| `REJECTED` | `null` | có | có |
| `FAILED` | `null` | `null` | có |

`imageUrl` là signed URL sống 5 phút, hoặc `null` nếu ảnh đã hết hạn 90 ngày. Reading kẹt `PROCESSING` quá 2 phút được dọn như ở `GET /readings`.

### DELETE /readings/{id}

Path: `id`. Không có body.

- Server xoá file ảnh trong storage, đặt `result = null`, `imageKey = null`, `deletedAt = now`, rồi trả `204`.
- Reading bị **ẩn hẳn**: không còn trong `GET /readings`; `GET`/`DELETE /readings/{id}` trả `404`.
- Document vẫn được giữ, vì sổ cái credits tham chiếu tới nó.
- Không hoàn credit.

| Trường hợp | Response |
| --- | --- |
| Reading `DONE`, `REJECTED`, `FAILED` | `204` |
| Reading `PROCESSING` | `409 READING_IN_PROGRESS`; xoá lại sau khi xử lý xong |
| Không tồn tại, đã xoá, hoặc thuộc user khác | `404 NOT_FOUND` |
