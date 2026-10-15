# CONTEXT — Bối cảnh dự án

Đọc file này trước khi viết code hoặc sửa thiết kế. File này tóm tắt những gì cần biết để không phá vỡ nghiệp vụ; chi tiết nằm trong `docs/`.

## Dự án là gì

PalmSight là web app (PWA) cho người dùng Việt Nam:

1. Chọn 1 trong 3 trường phái bói.
2. Tích các mục muốn bói, hoặc chọn bói toàn bộ.
3. Chụp ảnh lòng bàn tay.
4. Nhận bài bói chỉ tay do AI viết.

App dùng **credits**: mỗi lần xem trừ 1 credit. Người dùng có credits khi đăng ký (+3), khi nhập mã giới thiệu của người khác (+1), và khi có người nhập mã giới thiệu của mình (+2). MVP không bán credits.

Đây là dự án nhỏ của **2 người**, làm cho vui, repo công khai. Thiết kế ưu tiên đơn giản và các gói miễn phí; không làm những thứ chỉ cần khi có nhiều người dùng (trang admin, chống gian lận nâng cao, Redis…).

## Trạng thái hiện tại

- Giai đoạn: **thiết kế xong, bắt đầu Phase 0** (cập nhật 2026-10-14).
- `frontend/` mới là boilerplate React + Vite, **chưa** theo thiết kế: đăng nhập giả, token lưu `localStorage`, phân quyền role, trang mẫu. Danh sách giữ/bỏ ở [ADR-0007](docs/adr/0007-vite-spa-frontend.md). `backend/` và `shared/` chưa có.
- Tài liệu thiết kế: `docs/` là nguồn duy nhất.
- Việc tiếp theo: Phase 0 trong [docs/roadmap.md](docs/roadmap.md).

## Yêu cầu đã chốt với chủ dự án

| # | Yêu cầu |
| --- | --- |
| 1 | Web app (PWA), không làm app native |
| 2 | Stack: React + Vite (SPA) + NestJS + MongoDB |
| 3 | Đăng ký/đăng nhập bằng email hoặc username + mật khẩu, **bắt buộc xác minh email** trước khi đăng nhập; quên mật khẩu qua email (Gmail SMTP). Google/Facebook là cách đăng nhập phụ. Cùng email đã xác minh thì gộp một tài khoản |
| 4 | Tài khoản mới được 3 credits; credits không hết hạn; chưa bán credits |
| 5 | Mỗi lần xem tốn 1 credit; AI lỗi hoặc ảnh không phải bàn tay thì hoàn credit (người dùng không mất credit) |
| 6 | Người khác nhập mã giới thiệu của mình → mình được +2 **ngay**; người nhập được +1 (kể cả khi chủ mã hết lượt trong ngày) |
| 7 | Nhập mã bất cứ lúc nào, mỗi tài khoản một lần; mỗi chủ mã tối đa 10 lượt thưởng/ngày |
| 8 | Không cần chống gian lận chặt (không kiểm tra thiết bị/IP), không cần trang admin |
| 9 | Người dùng chọn 1 trong 3 trường phái, rồi tích các mục muốn bói (hoặc bói toàn bộ); kết quả chỉ gồm các mục đã chọn; chụp 1 tay |
| 10 | AI dùng API key miễn phí của **Groq** |
| 11 | Chỉ tiếng Việt; không lưu ảnh lòng bàn tay trên server |
| 12 | Giữ ngrok cho dev; deploy ưu tiên gói miễn phí |
| 13 | Tên app: **PalmSight** |
| 14 | **Không có tự xoá tài khoản** trong app (chặn xoá–đăng ký lại để farm credits). Xoá thủ công theo yêu cầu qua email; tài khoản tạo lại từ định danh đã xoá có 0 credits và không được nhập mã |

## Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| Credit | Đơn vị dùng để xem bói. Số nguyên, không âm, không hết hạn. |
| Ledger / sổ cái | Collection `credit_transactions`; mỗi lần cộng/trừ credits là một document. |
| Balance | `users.creditBalance`, cache của tổng sổ cái. |
| Referrer | Chủ mã giới thiệu, người được thưởng +2. |
| Referee | Người nhập mã của referrer. Được thưởng +1 (`REFEREE_BONUS`). |
| Referral code | Mã 8 ký tự in hoa, mỗi user một mã, sinh khi tạo tài khoản. |
| Reading | Một lần xem bói: trường phái + các mục đã chọn + tay + kết quả AI + trạng thái. Không chứa ảnh. |
| Trường phái (`school`) | Cách diễn giải chỉ tay: `WESTERN`, `EASTERN`, `VEDIC`. Định nghĩa trong `READING_SCHOOLS`. |
| Mục bói (`topic`) | Một thứ người dùng tích để bói: mục riêng của trường phái hoặc một khía cạnh cuộc sống. |
| Section | Mục riêng của trường phái (ví dụ `nguHanh`, `heartLine`), trả về trong `result.sections`. |
| Aspect | Khía cạnh cuộc sống dùng chung (`personality`, `love`, `career`, `finance`, `health`, `family`), định nghĩa trong `LIFE_ASPECTS`. |
| Idempotency-Key | UUID v4 client gửi trong header của `POST /readings`. Chỉ dùng lại khi không nhận được response, để gửi lại không bị trừ credit hai lần. |
| Identity | Một liên kết Google hoặc Facebook, nhúng trong document user. Mật khẩu không phải identity mà là field `users.passwordHash`. |
| Đăng ký chờ (`pending_registrations`) | Đăng ký email/mật khẩu chưa bấm link xác minh. Chưa phải user, chưa có credits; tự xoá sau 24 giờ. |
| `PalmResult` | JSON kết quả AI trả về, lưu trong `readings.result`. |

## Quy tắc bất biến (không được phá)

1. **Mọi thay đổi credits đi qua `CreditLedgerService`.** Service này ghi một document `credit_transactions` và cập nhật `users.creditBalance` trong **cùng một MongoDB transaction**. Không module nào khác được `$inc` hay `$set` field `creditBalance`. Sau mỗi lần cập nhật số dư, service kiểm tra `matchedCount === 1`; không khớp (user không tồn tại hoặc đã bị xoá) thì ném lỗi để transaction rollback, không ghi sổ cái.
2. **Số dư không bao giờ âm.** Trừ bằng `updateOne` có điều kiện `creditBalance >= 1`. Không đọc số dư rồi mới trừ trong code.
3. Tổng `amount` của một user luôn bằng `creditBalance`.
4. **Trừ credit trước khi gọi AI**, hoàn lại (`READING_REFUND`) nếu AI lỗi, timeout hoặc ảnh không phải lòng bàn tay. Mỗi reading tối đa 1 lần trừ và 1 lần hoàn.
5. `SIGNUP_BONUS` chỉ cộng khi **tạo user** (xác minh email đăng ký, hoặc lần đầu đăng nhập Google/Facebook), một lần mỗi user. Gắn thêm mật khẩu hoặc Google/Facebook vào user cũ không cộng thêm. User tạo lại từ định danh có trong `deleted_identities` không được cộng.
6. Mỗi user chỉ nhập mã giới thiệu **một lần**. Không được nhập mã của chính mình hoặc của người mình đã mời. Thưởng người nhập (+1) và chủ mã (+2) ghi trong cùng một transaction với document `referrals`.
7. Mọi reading có `school` và `topics` (≥ 1 mục, đã chuẩn hoá). Kết quả AI phải có **đúng** các mục trong `topics`: không thiếu, không thừa. Giá luôn 1 credit, dù chọn bao nhiêu mục.
8. API key AI, secret OAuth, mật khẩu SMTP và chuỗi kết nối MongoDB **chỉ nằm trên server**. Repo công khai: không bao giờ commit `.env`.
9. **Server không lưu ảnh lòng bàn tay** ([ADR-0010](docs/adr/0010-no-image-storage.md)). Ảnh chỉ nằm trong bộ nhớ trong lúc xử lý request (multer `memoryStorage`, `sharp` xử lý buffer), được xoá EXIF trước khi gửi AI, và không được ghi ra ổ đĩa, thư mục tạm, storage, database hay log.
10. Mọi trang kết quả hiển thị câu miễn trừ: "Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn."
11. **Không lưu mật khẩu thô hay token thô.** Mật khẩu hash bằng argon2id. Token trong link email và refresh token chỉ lưu bản hash SHA-256.
12. **Không sửa hay xoá dữ liệu trực tiếp trên database** (Compass, Atlas UI, mongosh) với `users`, `credit_transactions`, `referrals`, `readings`, `deleted_identities`. Thay đổi phải đi qua API hoặc script: xoá user bằng `users:delete`, chỉnh credits bằng `credits:adjust`. MongoDB không có khoá ngoại, nên xoá tay sẽ để lại dữ liệu mồ côi, sổ cái lệch và bỏ qua bước chặn nhận thưởng lại. Xem dữ liệu hằng ngày bằng user database **chỉ đọc**.
13. **Mọi request đã đăng nhập phải thuộc về một user còn hoạt động.** Auth guard đọc user theo `sub` trong access token; không tìm thấy hoặc `deletedAt` khác `null` thì trả `401 UNAUTHENTICATED`. Không giả định user luôn tồn tại.

## Quyết định đã chốt

| ADR | Quyết định |
| --- | --- |
| [0001](docs/adr/0001-credit-ledger.md) | Credits dùng sổ cái append-only + số dư cache |
| [0002](docs/adr/0002-token-based-oauth.md) | Client lấy token từ SDK Google/Facebook, server tự xác minh; tự cấp JWT |
| [0003](docs/adr/0003-groq-as-ai-provider.md) | Groq là nhà cung cấp AI chính, Gemini dự phòng, qua interface `AiProvider` |
| [0004](docs/adr/0004-synchronous-readings.md) | `POST /readings` xử lý đồng bộ trong MVP |
| [0005](docs/adr/0005-monorepo-nextjs-nestjs.md) | pnpm workspaces, NestJS + MongoDB (Mongoose), không Redis. Phần Next.js đã bị ADR-0007 thay thế |
| [0006](docs/adr/0006-reading-schools.md) | Trường phái bói, chọn mục bói; kết quả dạng `sections` chung |
| [0007](docs/adr/0007-vite-spa-frontend.md) | Frontend là SPA React + Vite; repo `frontend/` · `backend/` · `shared/`; web và API chung một domain qua proxy/rewrite |
| [0008](docs/adr/0008-email-password-auth.md) | Đăng ký email/username + mật khẩu, bắt buộc xác minh email; Google/Facebook là cách đăng nhập phụ; gộp theo email đã xác minh; gửi mail qua Gmail SMTP |
| [0009](docs/adr/0009-manual-account-deletion.md) | Không cho tự xoá tài khoản; xoá thủ công theo yêu cầu; HMAC định danh đã xoá để chặn nhận thưởng lại |
| [0010](docs/adr/0010-no-image-storage.md) | Không lưu ảnh lòng bàn tay trên server; xử lý trong bộ nhớ, gửi AI rồi bỏ |

## Quy ước code

- TypeScript strict ở mọi package. Dữ liệu từ ngoài vào (request, response AI) không được để kiểu `any`; phải validate bằng **Yup**.
  - Schema object dùng `.noUnknown()`, để trường lạ bị từ chối.
  - Validate với `{ abortEarly: false }`, để trả đủ mọi trường lỗi trong `details.fields`.
  - Kiểu TypeScript lấy từ schema bằng `InferType`, không khai báo lặp lại.
- **API:**
  - Đường dẫn `/api/v1`, JSON `camelCase`, ID là ObjectId dạng chuỗi.
  - Lỗi theo dạng `{ error: { code, message, details } }`, với `code` lấy từ bảng trong [api-contract.md](docs/api-contract.md).
- **MongoDB:**
  - Tên collection `snake_case` số nhiều (`credit_transactions`), tên field `camelCase`, thời gian kiểu `Date` UTC.
  - Index khai báo trong schema Mongoose.
- Enum dùng chung (`CreditTransactionType`, `ReadingStatus`, `ReadingSchool`…) và `READING_SCHOOLS` định nghĩa một lần trong `shared/` (package `@palmsight/shared`).
- **`shared/` bị đóng gói vào bundle trình duyệt**, nên chỉ chứa thứ cả hai phía cần và ai đọc được cũng không sao: enum, key và tên hiển thị của trường phái/mục bói, Yup schema, kiểu request/response.
  - **Không** đặt vào đây: secret, prompt AI (nằm ở `backend/src/ai/prompts/`), hằng số chỉ server được biết.
  - **Không** import code chỉ chạy trên server (Mongoose, NestJS, nodemailer) hay code chỉ dùng ở frontend (React).
- **Frontend:**
  - Access token chỉ giữ trong bộ nhớ, không lưu `localStorage`.
  - Không đặt secret trong biến `VITE_*`, vì chúng được nhúng vào bundle.
- **Biến môi trường tách theo phía:** `backend/.env` và `frontend/.env`, mỗi phía có `.env.example` riêng. Secret của server không bao giờ nằm trong `frontend/`. Thêm biến mới thì cập nhật đúng file `.env.example` của phía dùng nó.
  - Form dùng Formik + Yup (có sẵn trong boilerplate). Schema dùng chung với API lấy từ `@palmsight/shared`.
- Các hằng số nghiệp vụ (đăng ký 3, chủ mã 2, người nhập mã 1, giá xem 1, trần 10) đọc từ env, không hard-code.
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
| Biến môi trường | [backend/.env.example](backend/.env.example) (secret của server), [frontend/.env.example](frontend/.env.example) (chỉ biến công khai `VITE_*`) |

## Câu hỏi mở

- [ ] Danh sách trường phái và các mục bói của từng trường phái (đang là đề xuất trong [ai-integration.md](docs/ai-integration.md#trường-phái-bói)).
