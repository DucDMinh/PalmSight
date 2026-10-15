# roadmap — Kế hoạch theo giai đoạn

Mỗi phase kết thúc bằng một bản chạy được. Chưa gán ngày; ước lượng tính theo 2 người làm bán thời gian. Cột "Gợi ý chia việc" chỉ để tham khảo.

## Phase 0 — Khung dự án

- [ ] pnpm workspaces ở gốc repo: `frontend`, `backend`, `@palmsight/shared` ([ADR-0007](adr/0007-vite-spa-frontend.md))
  - Đưa `frontend/` vào workspace: bỏ `pnpm-lock.yaml` riêng, đổi tên package thành `frontend`.
  - Chuyển husky và `LICENSE` của boilerplate lên gốc, hoặc xoá.
- [ ] Dọn boilerplate `frontend/` theo danh sách giữ/bỏ trong ADR-0007; sửa import sai chữ hoa/thường (`CommonIcons` → `commonIcons`)
- [ ] ESLint, Prettier, TypeScript strict, Vitest
- [ ] `docker-compose.yml`: MongoDB 7 (replica set 1 node) + MinIO + Mailpit
- [ ] Schema Mongoose cho 8 collection theo [database-erd.md](database-erd.md), script `db:sync-indexes`
- [ ] Vite `server.proxy` `/api/v1/*` → API, `envDir: '..'`; `GET /api/v1/health`
- [ ] GitHub Actions: lint, typecheck, test, build

**Xong khi:** `pnpm dev` chạy được frontend + backend, CI xanh.

## Phase 1 — Đăng nhập + credits

| Việc | Gợi ý chia việc |
| --- | --- |
| `MailService` (nodemailer, template tiếng Việt) + Mailpit | Backend |
| `POST /auth/register`, `verify-email`, `resend-verification`, `login` (email hoặc username), refresh, logout | Backend |
| `POST /auth/forgot-password`, `reset-password`, `PUT /me/password` | Backend |
| `POST /auth/google`, `POST /auth/facebook`, gộp tài khoản theo email đã xác minh | Backend |
| Tạo user, sinh `referralCode`, `SIGNUP_BONUS` +3 | Backend |
| Auth guard kiểm tra user tồn tại và `deletedAt = null` ở mỗi request | Backend |
| `CreditLedgerService` (kiểm tra `matchedCount === 1`, rollback nếu không khớp) + test song song | Backend |
| `GET /me`, `GET /me/credit-transactions` | Backend |
| Yup schema đăng ký/đăng nhập trong `shared/` | Cả hai |
| Màn `/login`, `/register`, `/register/check-email`, `/verify-email`, `/forgot-password`, `/reset-password`, `/account`, `/account/password`, `/wallet` | Frontend |

**Xong khi:** cả 2 thành viên đăng ký bằng email (xác minh qua Gmail thật), đăng nhập bằng username, đặt lại được mật khẩu; đăng nhập Google và Facebook qua ngrok gộp vào đúng tài khoản; thấy đúng 3 credits.

## Phase 2 — Xem bói

| Việc | Gợi ý chia việc |
| --- | --- |
| Upload + `sharp` (HEIC, EXIF, resize) + lưu MinIO/R2 | Backend |
| `AiProvider`: Groq, Gemini fallback, `FakeAiProvider` | Backend |
| `READING_SCHOOLS`, `LIFE_ASPECTS`, Yup schema `PalmResult` trong `shared/`; prompt 3 trường phái trong `backend/src/ai/prompts/` | Cả hai |
| `POST /readings` với `topics`, idempotency, trừ/hoàn credit, dọn reading kẹt | Backend |
| Màn `/scan` (chọn trường phái, tích mục / bói toàn bộ, chọn tay, camera), `/readings/:id`, `/readings` | Frontend |

**Xong khi:** chụp tay trên điện thoại thật, bói được cả 3 trường phái với 1 mục và với toàn bộ, số dư giảm đúng; lỗi AI được hoàn credit.

## Phase 3 — Giới thiệu bạn bè

| Việc | Gợi ý chia việc |
| --- | --- |
| `/r/:code` + cookie `ref_code` | Frontend |
| `POST /me/referral` (5 kiểm tra + trần 10 lượt/ngày; người nhập +1, chủ mã +2 trong một transaction), `GET /me/referrals` | Backend |
| Áp dụng `referralCode` lúc xác minh email đăng ký | Backend |
| Màn `/referral/enter`, `/referral`, nhập mã từ `/account` | Frontend |
| Script `credits:adjust`, `credits:reconcile`, `db:check` | Backend |

**Xong khi:** thành viên A nhập mã của B, A nhận +1 và B nhận +2 ngay; các ca trong [testing.md](testing.md) đều qua.

## Phase 4 — Ra mắt

- [ ] Trang `/privacy` (nêu việc giữ HMAC định danh sau khi xoá), `/terms`, `/data-deletion` (hướng dẫn gửi yêu cầu xoá qua email)
- [ ] Script `users:delete` + collection `deleted_identities`; kiểm tra định danh đã xoá khi tạo user ([ADR-0009](adr/0009-manual-account-deletion.md))
- [ ] Rate limit, header bảo mật, màn chờ "Đang đánh thức máy chủ"
- [ ] Deploy theo [deployment.md](deployment.md): Vercel + Render + Atlas M0 + R2 (lifecycle 90 ngày)
- [ ] Atlas: tạo hai user database `palmsight-app` (readWrite) và `palmsight-readonly` (read); `db:check` chạy hằng tuần bằng GitHub Actions
- [ ] PWA manifest, icon, cài ra màn hình chính
- [ ] Đánh giá AI với bộ ảnh mẫu cho cả 3 trường phái

**Xong khi:** bạn bè dùng được trên domain thật.

## Sau MVP (chưa cam kết)

- Thêm trường phái hoặc chủ đề bói
- Chia sẻ kết quả thành ảnh đẹp lên mạng xã hội
- Bán gói credits
- So sánh tay hai người
- Trang admin, nếu cần
