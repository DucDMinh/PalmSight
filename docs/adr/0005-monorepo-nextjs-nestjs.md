# ADR-0005: Monorepo Next.js + NestJS + MongoDB

- Trạng thái: Accepted
- Ngày: 2026-10-14

## Bối cảnh

Cần web chạy tốt trên điện thoại và một API rõ ràng. Muốn dùng chung kiểu dữ liệu (DTO, enum, danh sách trường phái, schema `PalmResult`) giữa frontend và backend. Team 2 người chọn stack Next.js + NestJS + MongoDB.

## Quyết định

- Một repo, **pnpm workspaces**:
  - `apps/web`: Next.js, PWA;
  - `apps/api`: NestJS + Mongoose;
  - `packages/shared`: zod schema, enum, `READING_SCHOOLS`, DTO.
- Web rewrite `/api/v1/*` sang API để chạy chung một domain.
- **MongoDB 7** qua **Mongoose** (`@nestjs/mongoose`):
  - Chạy dạng replica set để dùng transaction: Atlas M0 khi deploy, replica set 1 node trong Docker khi dev.
  - Index và validator khai báo trong schema, tạo bằng script `db:sync-indexes`.
- Không dùng Redis: API chạy 1 instance, rate limit đếm trong bộ nhớ (`@nestjs/throttler`).

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| PostgreSQL | Hợp với sổ cái nhờ constraint SQL, nhưng team chọn MongoDB; unique index, partial index và validator của MongoDB đủ cho các ràng buộc cần thiết |
| Prisma với MongoDB | Prisma hỗ trợ MongoDB hạn chế hơn (không có migration, khai báo index đặc biệt kém linh hoạt); Mongoose là lựa chọn phổ biến với NestJS |
| Chỉ Next.js (route handlers làm API) | Logic nghiệp vụ trộn với web; transaction và job nền kém rõ ràng |
| Hai repo riêng | Khó đồng bộ kiểu dữ liệu và thay đổi API |

## Hệ quả

- Hai tiến trình khi dev và hai dịch vụ khi deploy.
- Thay đổi schema dùng chung phải build lại cả hai app.
- Không có migration tự động: thay đổi cấu trúc document phải tương thích với dữ liệu cũ, hoặc viết script chuyển dữ liệu riêng.
- Nếu sau này chạy nhiều instance API, phải chuyển rate limit sang nơi lưu chung (Redis hoặc MongoDB).
