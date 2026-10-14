# CONTEXT — Bối cảnh dự án

Đọc file này trước khi viết code hoặc sửa thiết kế. File này tóm tắt những gì cần biết để không phá vỡ nghiệp vụ; chi tiết nằm trong `docs/`.

## Dự án là gì

PalmSight là web app (PWA) cho người dùng Việt Nam:

1. Chọn 1 trong 3 trường phái bói.
2. Tích các mục muốn bói, hoặc chọn bói toàn bộ.
3. Chụp ảnh lòng bàn tay.
4. Nhận bài bói chỉ tay do AI viết.

App dùng **credits**: mỗi lần xem trừ 1 credit. Người dùng có credits khi đăng ký (+3) và khi có người nhập mã giới thiệu của mình (+2). MVP không bán credits.

Đây là dự án nhỏ của **2 người**, làm cho vui, repo công khai. Thiết kế ưu tiên đơn giản và các gói miễn phí; không làm những thứ chỉ cần khi có nhiều người dùng (trang admin, chống gian lận nâng cao, Redis…).

## Trạng thái hiện tại

- Giai đoạn: **thiết kế xong, chưa có code** (cập nhật 2026-10-14).
- Tài liệu thiết kế: `docs/` là nguồn duy nhất.
- Việc tiếp theo: Phase 0 trong [docs/roadmap.md](docs/roadmap.md).

## Yêu cầu đã chốt với chủ dự án

| # | Yêu cầu |
| --- | --- |
| 1 | Web app (PWA), không làm app native |
| 2 | Stack: Next.js + NestJS + MongoDB |
| 3 | Đăng nhập Google / Facebook; cùng email thì gộp một tài khoản |
| 4 | Tài khoản mới được 3 credits; credits không hết hạn; chưa bán credits |
| 5 | Mỗi lần xem tốn 1 credit; AI lỗi hoặc ảnh không phải bàn tay thì hoàn credit (người dùng không mất credit) |
| 6 | Người khác nhập mã giới thiệu của mình → mình được +2 **ngay**; người nhập không được gì |
| 7 | Nhập mã bất cứ lúc nào, mỗi tài khoản một lần; mỗi chủ mã tối đa 10 lượt thưởng/ngày |
| 8 | Không cần chống gian lận chặt (không kiểm tra thiết bị/IP), không cần trang admin |
| 9 | Người dùng chọn 1 trong 3 trường phái, rồi tích các mục muốn bói (hoặc bói toàn bộ); kết quả chỉ gồm các mục đã chọn; chụp 1 tay |
| 13 | Tên app: **PalmSight** |
| 10 | AI dùng API key miễn phí của **Groq** |
| 11 | Chỉ tiếng Việt; giữ ảnh 90 ngày |
| 12 | Giữ ngrok cho dev; deploy ưu tiên gói miễn phí |

## Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Credit | Đơn vị dùng để xem bói. Số nguyên, không âm, không hết hạn. |
| Ledger / sổ cái | Collection `credit_transactions`; mỗi lần cộng/trừ credits là một document. |
| Balance | `users.creditBalance`, cache của tổng sổ cái. |
| Referrer | Chủ mã giới thiệu, người được thưởng +2. |
| Referee | Người nhập mã của referrer. Không được thưởng. |
| Referral code | Mã 8 ký tự in hoa, mỗi user một mã, sinh khi tạo tài khoản. |
| Reading | Một lần xem bói: ảnh + trường phái + các mục đã chọn + kết quả AI + trạng thái. |
| Trường phái (`school`) | Cách diễn giải chỉ tay: `WESTERN`, `EASTERN`, `VEDIC`. Định nghĩa trong `READING_SCHOOLS`. |
| Mục bói (`topic`) | Một thứ người dùng tích để bói: mục riêng của trường phái hoặc một khía cạnh cuộc sống. |
| Section | Mục riêng của trường phái (ví dụ `nguHanh`, `heartLine`), trả về trong `result.sections`. |
| Aspect | Khía cạnh cuộc sống dùng chung (`personality`, `love`, `career`, `finance`, `health`, `family`), định nghĩa trong `LIFE_ASPECTS`. |
| Idempotency-Key | UUID client gửi kèm `POST /readings` để gửi lại không bị trừ credit hai lần. |
| Identity | Một cách đăng nhập (Google hoặc Facebook), nhúng trong document user. |
| `PalmResult` | JSON kết quả AI trả về, lưu trong `readings.result`. |

## Quy tắc bất biến (không được phá)

1. **Mọi thay đổi credits đi qua `CreditLedgerService`.** Service này ghi một document `credit_transactions` và cập nhật `users.creditBalance` trong **cùng một MongoDB transaction**. Không module nào khác được `$inc` hay `$set` field `creditBalance`.
2. **Số dư không bao giờ âm.** Trừ bằng `updateOne` có điều kiện `creditBalance >= 1`. Không đọc số dư rồi mới trừ trong code.
3. Tổng `amount` của một user luôn bằng `creditBalance`.
4. **Trừ credit trước khi gọi AI**, hoàn lại (`READING_REFUND`) nếu AI lỗi, timeout hoặc ảnh không phải lòng bàn tay. Mỗi reading tối đa 1 lần trừ và 1 lần hoàn.
5. `SIGNUP_BONUS` chỉ một lần mỗi user. Gắn thêm Google/Facebook vào user cũ không cộng thêm.
6. Mỗi user chỉ nhập mã giới thiệu **một lần**. Không được nhập mã của chính mình hoặc của người mình đã mời.
7. Mọi reading có `school` và `topics` (≥ 1 mục, đã chuẩn hoá). Kết quả AI phải có **đúng** các mục trong `topics`: không thiếu, không thừa. Giá luôn 1 credit, dù chọn bao nhiêu mục.
8. API key AI, secret OAuth, chuỗi kết nối MongoDB và thông tin storage **chỉ nằm trên server**. Repo công khai: không bao giờ commit `.env`.
9. Ảnh người dùng nằm trong bucket **private**, chỉ truy cập qua signed URL ngắn hạn; xoá EXIF trước khi lưu.
10. Mọi trang kết quả hiển thị câu miễn trừ: "Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn."

## Quyết định đã chốt

| ADR | Quyết định |
| --- | --- |
| [0001](docs/adr/0001-credit-ledger.md) | Credits dùng sổ cái append-only + số dư cache |
| [0002](docs/adr/0002-token-based-oauth.md) | Client lấy token từ SDK Google/Facebook, server tự xác minh; tự cấp JWT |
| [0003](docs/adr/0003-groq-as-ai-provider.md) | Groq là nhà cung cấp AI chính, Gemini dự phòng, qua interface `AiProvider` |
| [0004](docs/adr/0004-synchronous-readings.md) | `POST /readings` xử lý đồng bộ trong MVP |
| [0005](docs/adr/0005-monorepo-nextjs-nestjs.md) | Monorepo pnpm: Next.js + NestJS + MongoDB (Mongoose), không Redis |
| [0006](docs/adr/0006-reading-schools.md) | Trường phái bói, chọn mục bói; kết quả dạng `sections` chung |

## Quy ước code

- TypeScript strict ở mọi package. Dữ liệu từ ngoài vào (request, response AI) không được để kiểu `any`; phải validate bằng zod.
- **API:**
  - Đường dẫn `/api/v1`, JSON `camelCase`, ID là ObjectId dạng chuỗi.
  - Lỗi theo dạng `{ error: { code, message, details } }`, với `code` lấy từ bảng trong [api-contract.md](docs/api-contract.md).
- **MongoDB:**
  - Tên collection `snake_case` số nhiều (`credit_transactions`), tên field `camelCase`, thời gian kiểu `Date` UTC.
  - Index khai báo trong schema Mongoose.
- Enum dùng chung (`CreditTransactionType`, `ReadingStatus`, `ReadingSchool`…) và `READING_SCHOOLS` định nghĩa một lần trong `packages/shared`.
- Các hằng số nghiệp vụ (3, 2, 1, 10) đọc từ env, không hard-code.
- Ngày (khi tính trần 10 lượt/ngày) tính theo giờ Việt Nam (`Asia/Ho_Chi_Minh`).
- Văn bản hiển thị cho người dùng: tiếng Việt. Code, tên biến, commit message: tiếng Anh.

## Đi đâu để tìm gì

| Cần biết | Xem |
| --- | --- |
| Credits được cộng/trừ khi nào | [docs/business-rules.md](docs/business-rules.md) |
| Thứ tự các bước của một luồng | [docs/workflow.md](docs/workflow.md) |
| Collection, field, index | [docs/database-erd.md](docs/database-erd.md) |
| Request/response, mã lỗi | [docs/api-contract.md](docs/api-contract.md) |
| Trường phái, mục bói, prompt, schema kết quả AI | [docs/ai-integration.md](docs/ai-integration.md) |
| Màn hình và trạng thái UI | [docs/screens.md](docs/screens.md) |
| Biến môi trường | [.env.example](.env.example) |

## Câu hỏi mở

- [ ] Danh sách trường phái và các mục bói của từng trường phái (đang là đề xuất trong [ai-integration.md](docs/ai-integration.md#trường-phái-bói)).
