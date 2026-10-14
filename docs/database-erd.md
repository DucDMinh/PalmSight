# database-erd — Cơ sở dữ liệu (MongoDB)

MongoDB 7, truy cập qua Mongoose (`@nestjs/mongoose`). Tên collection viết thường kiểu `snake_case`, tên field viết `camelCase`, `_id` là `ObjectId`, thời gian lưu kiểu `Date` (UTC).

Transaction nhiều document cần **replica set**: MongoDB Atlas (kể cả gói free M0) có sẵn; ở local, `docker-compose.yml` chạy MongoDB dạng replica set một node.

## Sơ đồ quan hệ

```mermaid
erDiagram
    users ||--|{ identities : "nhúng trong users"
    users ||--o{ sessions : "1 : N"
    users ||--o{ referrals : "referrerId 1 : N"
    users ||--o| referrals : "refereeId 1 : 1"
    users ||--o{ readings : "1 : N"
    users ||--o{ credit_transactions : "1 : N"
    readings ||--o{ credit_transactions : "1 : 0..2"
    referrals ||--o| credit_transactions : "1 : 0..1"

    users {
        ObjectId _id PK
        string displayName
        string email "null"
        string referralCode UK
        int creditBalance "min 0"
        array identities
        Date createdAt
        Date deletedAt
    }
    identities {
        string provider "GOOGLE | FACEBOOK"
        string providerUserId UK
        string email
        Date linkedAt
    }
    sessions {
        ObjectId _id PK
        ObjectId userId FK
        string refreshTokenHash UK
        Date expiresAt "TTL"
        Date revokedAt
    }
    referrals {
        ObjectId _id PK
        ObjectId referrerId FK
        ObjectId refereeId FK, UK
        string codeUsed
        string status
    }
    readings {
        ObjectId _id PK
        ObjectId userId FK
        string idempotencyKey
        string school
        array topics
        string hand
        string status
        string imageKey
        object result
        Date deletedAt
    }
    credit_transactions {
        ObjectId _id PK
        ObjectId userId FK
        int amount "khác 0"
        string type
        int balanceAfter
        ObjectId readingId FK
        ObjectId referralId FK, UK
    }
```

`identities` không phải collection riêng mà là mảng nhúng trong `users`: mỗi user có tối đa 2 phần tử (Google, Facebook), và luôn được đọc cùng user.

## Đặc tả collection

### users

| Field | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `_id` | ObjectId | | |
| `displayName` | string | bắt buộc, ≤ 100 ký tự | Lấy từ Google/Facebook |
| `email` | string \| null | lowercase | Facebook có thể không trả email |
| `avatarUrl` | string \| null | | |
| `referralCode` | string | 8 ký tự, unique | Mã của chính user để chia sẻ |
| `creditBalance` | int | bắt buộc, validator `minimum: 0` | Cache của sổ cái |
| `identities` | array | ≥ 1 phần tử | Xem bảng dưới |
| `createdAt`, `updatedAt` | Date | | Mongoose `timestamps` |
| `deletedAt` | Date \| null | | Đánh dấu tài khoản đã xoá |

Phần tử của `identities`:

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| `provider` | `GOOGLE` \| `FACEBOOK` | |
| `providerUserId` | string | `sub` của Google / `id` của Facebook |
| `email` | string \| null | Email provider trả về lúc liên kết |
| `linkedAt` | Date | |

Index:
- `{ referralCode: 1 }` unique.
- `{ "identities.provider": 1, "identities.providerUserId": 1 }` unique, để một tài khoản Google/Facebook chỉ thuộc một user.
- `{ email: 1 }` không unique, dùng khi gộp tài khoản theo email.

### sessions

| Field | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `_id` | ObjectId | | |
| `userId` | ObjectId | bắt buộc, ref `users` | |
| `refreshTokenHash` | string | unique | SHA-256, không lưu token thô |
| `userAgent` | string \| null | | |
| `expiresAt` | Date | bắt buộc | 30 ngày |
| `revokedAt` | Date \| null | | Logout hoặc xoay vòng token |
| `createdAt` | Date | | |

Index:
- `{ refreshTokenHash: 1 }` unique.
- `{ userId: 1 }`.
- TTL `{ expiresAt: 1 }, { expireAfterSeconds: 0 }`: MongoDB tự xoá session hết hạn.

### referrals

| Field | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `_id` | ObjectId | | |
| `referrerId` | ObjectId | bắt buộc, ref `users` | Chủ mã |
| `refereeId` | ObjectId | bắt buộc, ref `users`, **unique** | Mỗi user chỉ nhập mã 1 lần |
| `codeUsed` | string | bắt buộc | |
| `status` | `REWARDED` \| `CAPPED` | bắt buộc | Xem [business-rules.md](business-rules.md) |
| `createdAt` | Date | | |

Index:
- `{ refereeId: 1 }` unique.
- `{ referrerId: 1, createdAt: -1 }`: liệt kê người đã mời và đếm lượt thưởng trong ngày.

### readings

| Field | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `_id` | ObjectId | | |
| `userId` | ObjectId | bắt buộc, ref `users` | |
| `idempotencyKey` | string | bắt buộc, UUID v4 (36 ký tự) | Header `Idempotency-Key` của `POST /readings` |
| `school` | `WESTERN` \| `EASTERN` \| `VEDIC` | bắt buộc | Trường phái người dùng chọn, xem [ai-integration.md](ai-integration.md) |
| `topics` | string[] | bắt buộc, ≥ 1 phần tử | Các mục được bói (đã điền đủ khi người dùng chọn "Bói toàn bộ"), theo thứ tự chuẩn của trường phái |
| `hand` | `LEFT` \| `RIGHT` | bắt buộc | Người dùng chọn; AI không được đổi |
| `status` | `PROCESSING` \| `DONE` \| `FAILED` \| `REJECTED` | bắt buộc | `REJECTED` = ảnh không phải lòng bàn tay |
| `imageKey` | string \| null | | Key trong object storage; `null` sau khi ảnh bị xoá |
| `result` | object \| null | | `PalmResult`, theo schema ở [ai-integration.md](ai-integration.md) |
| `rejectReason` | string \| null | | |
| `aiProvider`, `aiModel` | string \| null | | Phục vụ debug, đổi model |
| `errorCode` | string \| null | | |
| `latencyMs` | int \| null | | |
| `createdAt`, `completedAt` | Date | | |
| `deletedAt` | Date \| null | | Người dùng xoá reading: ẩn khỏi API. Document được giữ vì sổ cái tham chiếu tới nó; `result` và `imageKey` về `null` |

Index:
- `{ userId: 1, idempotencyKey: 1 }` unique. Reading đã xoá vẫn giữ key, nên gửi lại key đó trả `404`.
- `{ userId: 1, createdAt: -1 }`: trang lịch sử; truy vấn luôn lọc `deletedAt: null`.
- `{ status: 1, createdAt: 1 }`: tìm reading kẹt ở `PROCESSING`.

### credit_transactions

| Field | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `_id` | ObjectId | | ObjectId tăng dần theo thời gian, dùng làm cursor phân trang |
| `userId` | ObjectId | bắt buộc, ref `users` | |
| `amount` | int | bắt buộc, khác 0 | Dương = cộng, âm = trừ |
| `type` | `SIGNUP_BONUS` \| `REFERRAL_BONUS` \| `READING_SPEND` \| `READING_REFUND` \| `ADMIN_ADJUST` | bắt buộc | |
| `balanceAfter` | int | bắt buộc | Số dư sau giao dịch |
| `readingId` | ObjectId | ref `readings` | Chỉ có với `READING_*` |
| `referralId` | ObjectId | ref `referrals` | Chỉ có với `REFERRAL_BONUS` |
| `note` | string | | Bắt buộc với `ADMIN_ADJUST` |
| `createdAt` | Date | | |

Collection này chỉ thêm document mới, không sửa, không xoá.

Index:
- `{ userId: 1, _id: -1 }`: lịch sử credits.
- `{ userId: 1, type: 1 }` unique, `partialFilterExpression: { type: "SIGNUP_BONUS" }`: mỗi user chỉ nhận bonus đăng ký một lần.
- `{ readingId: 1, type: 1 }` unique, `partialFilterExpression: { readingId: { $exists: true } }`: mỗi reading tối đa 1 lần trừ, 1 lần hoàn.
- `{ referralId: 1 }` unique, `partialFilterExpression: { referralId: { $exists: true } }`: mỗi referral chỉ thưởng một lần.

## Quản lý index

MongoDB không có migration schema như SQL. Index và validator được khai báo trong schema Mongoose và tạo bằng script `pnpm --filter backend db:sync-indexes`, chạy mỗi lần deploy. Không bật `autoIndex` ở production.
