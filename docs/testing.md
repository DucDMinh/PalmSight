# testing — Chiến lược kiểm thử

Ưu tiên test nơi sai sót làm cộng/trừ credits sai: sổ cái, xem bói, mã giới thiệu. UI và nội dung AI được test ở mức vừa đủ.

## Các tầng test

| Tầng | Công cụ | Phạm vi | Chạy khi |
| --- | --- | --- | --- |
| Unit | Vitest | Hàm thuần: sinh mã giới thiệu, kiểm tra quy tắc referral, map lỗi, zod schema `PalmResult` cho từng trường phái | Mỗi commit |
| Integration | Vitest + `mongodb-memory-server` (`MongoMemoryReplSet`) + Supertest | Service và endpoint NestJS với MongoDB thật chạy trong bộ nhớ; AI và OAuth được mock | Mỗi PR |
| E2E | Playwright (viewport điện thoại) | Luồng chính trên trình duyệt, đăng nhập bằng provider giả ở môi trường test | Trước khi merge vào `main` |
| AI eval | Script thủ công + bộ ảnh mẫu | Chất lượng và an toàn nội dung bói | Khi đổi prompt, model hoặc thêm trường phái |

Test integration phải dùng `MongoMemoryReplSet` (replica set), không dùng `MongoMemoryServer` đơn lẻ. Lý do: transaction chỉ chạy trên replica set. Ngoài ra unique index phải được tạo trước khi chạy test (`syncIndexes()`).

## Ca test bắt buộc

### Credits

- [ ] User mới có đúng 3 credits và 1 document `SIGNUP_BONUS`.
- [ ] Đăng nhập lại, hoặc gắn thêm provider thứ hai, không cộng thêm.
- [ ] Xem bói thành công: số dư −1, có `READING_SPEND`, `balanceAfter` đúng.
- [ ] Số dư 0 → `402`, không tạo reading.
- [ ] **20 request `POST /readings` song song khi số dư 1 → đúng 1 thành công.**
- [ ] Gửi lại cùng `Idempotency-Key` → trả reading cũ, không trừ thêm.
- [ ] AI timeout / 5xx / sai schema 2 lần → `FAILED`, hoàn 1 credit, đúng 1 document `READING_REFUND`.
- [ ] `isPalm = false` → `REJECTED`, hoàn 1 credit.
- [ ] Dọn reading kẹt `PROCESSING` hoàn credit đúng 1 lần, kể cả khi hai lần dọn chạy chồng nhau.
- [ ] Sau mọi ca trên: tổng `amount` = `creditBalance`.

### Referral

- [ ] Mã hợp lệ → chủ mã +2 ngay, `REWARDED`, người nhập không đổi số dư.
- [ ] Mỗi mã lỗi trong [business-rules.md](business-rules.md) trả đúng HTTP status và `code`.
- [ ] Nhập mã sau khi tạo tài khoản lâu (ví dụ 30 ngày) vẫn được chấp nhận.
- [ ] **Một user gửi 10 request nhập mã song song → chỉ 1 referral được tạo.**
- [ ] Lượt thứ 11 trong ngày (giờ Việt Nam) → `CAPPED`, không cộng; sang ngày mới lại được cộng.

### Trường phái bói

- [ ] `school` không hợp lệ → `400 VALIDATION_ERROR`, không trừ credit.
- [ ] `topics` bỏ trống → `readings.topics` chứa đủ mọi mục của trường phái + 6 khía cạnh, theo thứ tự chuẩn.
- [ ] `topics` chọn 1 mục → kết quả chỉ có đúng mục đó; giá vẫn 1 credit.
- [ ] `topics` chọn theo thứ tự lộn xộn hoặc trùng lặp → được chuẩn hoá về thứ tự chuẩn, bỏ trùng.
- [ ] `topics` có mục của trường phái khác (ví dụ `nguHanh` với `WESTERN`) hoặc key lạ → `400 VALIDATION_ERROR`, không trừ credit.
- [ ] Kết quả AI thiếu mục được chọn, hoặc thừa mục không được chọn → coi là sai schema (gọi lại, rồi `FAILED` + hoàn).
- [ ] `result.school` khác `school` trong request → sai schema.

### Auth

- [ ] Google ID token sai `aud` / hết hạn → `401 OAUTH_INVALID_TOKEN`.
- [ ] Facebook token của app khác → `401`.
- [ ] Refresh token dùng lại sau khi đã xoay → thu hồi mọi phiên.
- [ ] User A không đọc/xoá được reading của user B: trả `404` chứ không phải `403`, để không lộ là reading đó có tồn tại.

### Ảnh

- [ ] File > 8 MB → `413`; file `.jpg` nhưng nội dung không phải ảnh → `415`.
- [ ] Ảnh lưu trong storage không còn EXIF.

## Mock AI

`AiProvider` có bản `FakeAiProvider` cho test. Kết quả trả về được chọn bằng cấu hình: `ok` (đúng schema của trường phái được yêu cầu), `not_palm`, `timeout`, `http_429`, `http_500`, `invalid_json`. Không gọi Groq thật trong CI.

## Đánh giá AI

Bộ ảnh mẫu đặt trong `backend/test/fixtures/palms/`. Chỉ dùng ảnh tay của thành viên dự án hoặc ảnh có quyền sử dụng; repo công khai nên không đưa ảnh người khác vào. Bộ mẫu gồm:

- Tay trái, tay phải.
- Ảnh tối, ảnh mờ.
- Ảnh không phải tay.
- Ảnh có chữ chèn lệnh.

Mỗi lần đổi prompt/model, chạy script đánh giá cho **cả 3 trường phái** và kiểm tra thủ công:

- Tỉ lệ JSON hợp lệ.
- Trả đúng các mục được chọn, không thiếu, không thừa (thử cả bói 1 mục và bói toàn bộ).
- Bói toàn bộ không bị cắt ngang vì vượt `AI_MAX_TOKENS`.
- Nội dung đúng tinh thần trường phái (ví dụ phương Đông phải nói về ngũ hành, không nói về 4 nguyên tố).
- Nhận đúng ảnh không phải tay.
- Không có nội dung bị cấm.
- Không làm theo chữ trong ảnh.
- Độ trễ trung bình.

## CI

GitHub Actions, mỗi PR chạy lần lượt:

1. `pnpm install --frozen-lockfile`
2. `lint`
3. `typecheck`
4. `test` (integration dùng `mongodb-memory-server`, không cần service container)
5. `build`

E2E chạy trên PR vào `main`. Repo công khai nên GitHub Actions miễn phí.
