# ADR-0010: Không lưu ảnh lòng bàn tay trên server

- Trạng thái: Accepted
- Ngày: 2026-10-15

## Bối cảnh

Thiết kế ban đầu lưu ảnh đã xử lý vào object storage (Cloudflare R2, MinIO khi dev), bucket private, truy cập qua signed URL 5 phút, tự xoá sau 90 ngày bằng lifecycle rule. Ảnh được dùng cho ảnh thu nhỏ ở lịch sử và màn kết quả.

Rà lại thì người dùng xem lại **bài bói**, gần như không xem lại ảnh tay của mình:

- Ảnh thu nhỏ trong lịch sử chỉ để trang trí; nhãn trường phái và ngày xem là đủ để nhận ra một lần xem.
- "Bói thêm mục khác / trường phái khác" đã dùng lại ảnh **còn trên máy** người dùng, không cần ảnh trên server.
- Gửi lại cùng `Idempotency-Key` sau khi mất mạng: client vẫn giữ ảnh trong bộ nhớ và gửi lại trong request.

Trong khi đó, ảnh lòng bàn tay có thể bị xem là dữ liệu sinh trắc học. Lưu ảnh kéo theo cả một mảng hạ tầng (bucket, signed URL, lifecycle, 7 biến `S3_*`, kiểm tra ảnh mồ côi) và rủi ro lộ dữ liệu.

## Quyết định

- Server **không lưu ảnh** ở bất kỳ đâu: không object storage, không ổ đĩa, không thư mục tạm, không database, không log.
- Luồng xử lý trong `POST /readings`: multer dùng `memoryStorage` (không dùng disk storage, vì trên Render nó vẫn ghi file vào `/tmp`) → `sharp` xử lý buffer trong bộ nhớ (HEIC → JPEG, xoay theo EXIF, xoá EXIF, resize 1280 px) → gửi AI dưới dạng base64 data URL → bỏ buffer khi request kết thúc.
- Reading chỉ lưu trường phái, mục, tay, trạng thái và kết quả chữ. Bỏ field `imageKey`; API bỏ `imageUrl` và `thumbnailUrl`.
- Client giữ ảnh vừa chụp trong bộ nhớ của app (chưa tải lại trang) để gửi lại khi mất mạng và để "Bói thêm". Không lưu ảnh vào IndexedDB hay `localStorage`.
- Ảnh vẫn được gửi cho nhà cung cấp AI (Groq, dự phòng Gemini), nên vẫn giữ checkbox đồng ý và `aiConsent=true`.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Lưu ảnh trên R2 90 ngày (thiết kế cũ) | Giữ dữ liệu nhạy cảm chỉ để hiện ảnh thu nhỏ; thêm hạ tầng và việc vận hành |
| Lưu ảnh nhỏ ngắn hạn trên server | Vẫn phải có storage, chính sách lưu giữ và quy trình xoá; lợi ích không đáng |
| Lưu ảnh trên máy người dùng (IndexedDB) | Có thể thêm sau nếu muốn lịch sử có hình; MVP chưa cần |

## Hệ quả

- Bỏ module `storage/`, MinIO trong docker-compose, Cloudflare R2 khi deploy, các biến `S3_*` và `SIGNED_URL_TTL_SECONDS`.
- Lịch sử và màn kết quả không có ảnh; thay bằng nhãn trường phái.
- Xoá reading và `users:delete` chỉ cần xoá kết quả chữ. `db:check` không còn kiểm tra ảnh mồ côi.
- Khi AI bói sai, dev không xem lại được ảnh gốc của người dùng. Chất lượng AI được đánh giá bằng bộ ảnh mẫu trong `backend/test/fixtures/palms/`.
- Tải lại trang thì mất ảnh vừa chụp: muốn "Bói thêm" thì phải chụp lại.
- Ảnh gửi tới Groq/Gemini chịu chính sách lưu giữ của nhà cung cấp đó; trang `/privacy` phải nêu rõ.
