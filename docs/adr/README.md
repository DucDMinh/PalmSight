# Architecture Decision Records

Mỗi file ghi một quyết định kiến trúc: bối cảnh, lựa chọn và hệ quả. Khi muốn đổi một quyết định đã chốt, viết ADR mới và đánh dấu ADR cũ là `Superseded by ADR-xxxx`, thay vì xoá ADR cũ.

| ADR | Tiêu đề | Trạng thái |
| --- | --- | --- |
| [0001](0001-credit-ledger.md) | Credits dùng sổ cái append-only + số dư cache | Accepted |
| [0002](0002-token-based-oauth.md) | Đăng nhập bằng token từ SDK, server tự xác minh | Accepted |
| [0003](0003-groq-as-ai-provider.md) | Groq là nhà cung cấp AI chính | Accepted |
| [0004](0004-synchronous-readings.md) | Xử lý xem bói đồng bộ trong MVP | Accepted |
| [0005](0005-monorepo-nextjs-nestjs.md) | Monorepo Next.js + NestJS + MongoDB | Superseded một phần by 0007 |
| [0006](0006-reading-schools.md) | Trường phái bói, chọn mục bói và kết quả dạng `sections` chung | Accepted |
| [0007](0007-vite-spa-frontend.md) | Frontend SPA React + Vite; repo `frontend/` · `backend/` · `shared/` | Accepted |

## Mẫu

```markdown
# ADR-XXXX: <Tiêu đề>

- Trạng thái: Proposed | Accepted | Superseded by ADR-YYYY
- Ngày: YYYY-MM-DD

## Bối cảnh
## Quyết định
## Các phương án đã cân nhắc
## Hệ quả
```
