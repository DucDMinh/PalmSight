# ai-integration — Tích hợp AI bói chỉ tay

## Nhà cung cấp AI

AI bói toán dùng **Google Gemini API** làm nhà cung cấp chính; **Groq** làm dự phòng khi Gemini hết hạn mức hoặc gặp lỗi.

| Thành phần | Vai trò | Ghi chú |
| --- | --- | --- |
| **Google Gemini API** (free tier) — chính | Model vision đọc ảnh và viết bài bói | Gemini 3.8 Flash |
| **Groq** (free API key) — dự phòng | Fallback khi Gemini hết quota hoặc lỗi | API tương thích OpenAI |

ngrok xuất hiện trong tài liệu chỉ là công cụ dev, không liên quan tới AI: nó mở server local ra HTTPS để test Facebook Login và camera điện thoại (`getUserMedia` chỉ chạy trên HTTPS).

Backend chỉ phụ thuộc interface `AiProvider.readPalm(image, { school, topics, hand }) → PalmResult`; đổi nhà cung cấp bằng biến môi trường, không sửa code nghiệp vụ. API key chỉ nằm trên server, không bao giờ gửi xuống client.

**Biến môi trường**

```bash
AI_PROVIDER=gemini                   # gemini | groq
AI_MODEL=gemini-3.8-flash
GEMINI_API_KEY=xxx
AI_FALLBACK_PROVIDER=groq
AI_FALLBACK_MODEL=qwen/qwen3.8-27b
AI_BASE_URL=https://api.groq.com/openai/v1
GROQ_API_KEY=gsk_xxx
AI_TIMEOUT_MS=40000
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**Tiền xử lý ảnh trước khi gửi AI**: chuyển HEIC → JPEG, xoay theo EXIF rồi xoá toàn bộ EXIF (có GPS), resize cạnh dài tối đa 1280 px, JPEG quality 85, gửi dạng base64 data URL.

Tên model và hạn mức free tier viết theo trí nhớ, chưa tra cứu lại; cần kiểm tra trang Models và Rate Limits trước khi chốt.

## Trường phái bói

Người dùng chọn một trường phái trước khi chụp. AI vẫn đọc toàn bộ bàn tay, nhưng diễn giải và trình bày theo trường phái đã chọn. Mọi trường phái đều tốn 1 credit. Danh sách trường phái và các mục bên dưới là **đề xuất**, có thể thêm/bớt.

| `school` | Tên hiển thị | Các mục bói riêng (`sections`, theo thứ tự hiển thị) |
| --- | --- | --- |
| `WESTERN` | Chỉ tay phương Tây | `handShape` dáng tay theo 4 nguyên tố (Đất, Khí, Lửa, Nước) · `heartLine` đường tình cảm · `headLine` đường trí tuệ · `lifeLine` đường sinh mệnh · `fateLine` đường định mệnh · `sunLine` đường danh vọng · `mounts` 7 gò (Kim Tinh, Mộc Tinh, Thổ Tinh, Thái Dương, Thuỷ Tinh, Thái Âm, Hoả Tinh) |
| `EASTERN` | Chỉ tay phương Đông (Trung Hoa) | `nguHanh` dáng tay ngũ hành (Kim, Mộc, Thuỷ, Hoả, Thổ) · `thienVan` Thiên văn (đường tình cảm) · `nhanVan` Nhân văn (đường trí tuệ) · `diaVan` Địa văn (đường sinh mệnh) · `batQuai` 8 cung bát quái và Minh Đường giữa lòng bàn tay · `fingers` hình dáng các ngón |
| `VEDIC` | Chỉ tay Ấn Độ (Hast Samudrika Shastra) | `planetMounts` các gò theo 9 hành tinh · `majorLines` các đường chính · `specialSigns` dấu hiệu đặc biệt (hình cá, đinh ba, hoa sen, ngôi sao, chữ thập…) · `thumb` ngón cái |

Ngoài các mục riêng, mọi trường phái có chung 6 **khía cạnh cuộc sống** (`aspects`): `personality` tính cách · `love` tình cảm · `career` sự nghiệp · `finance` tài chính · `health` sức khoẻ · `family` gia đạo.

`summary`, `advice`, `disclaimer` luôn có trong kết quả, không cần chọn.

## Chọn mục bói

Sau khi chọn trường phái, người dùng tích các **mục** muốn bói, hoặc bấm **Bói toàn bộ**. Mỗi mục (`topic`) là:

- một mục riêng của trường phái đã chọn (ví dụ `heartLine`, `nguHanh`), hoặc
- một khía cạnh cuộc sống (`love`, `career`…).

| Quy tắc | Chi tiết |
| --- | --- |
| Số mục tối thiểu | 1 |
| Bói toàn bộ | Gửi `topics` rỗng hoặc bỏ trống → server tự điền tất cả mục của trường phái + 6 khía cạnh |
| Mục không thuộc trường phái | `400 VALIDATION_ERROR` (ví dụ chọn `nguHanh` với `WESTERN`) |
| Giá | Luôn 1 credit, dù chọn 1 mục hay toàn bộ |

## Thiết kế Prompt & Tiêu thụ Token

### Vai trò của AI

Prompt đóng vai trò của một **chuyên gia bói chỉ tay giàu kinh nghiệm, thấu cảm và chừng mực**.

- Không nói những câu mê tín dị đoan tuyệt đối ("bạn sẽ phá sản vào năm 35 tuổi", "bạn sẽ kết hôn hai lần"), không phán xét đạo đức.
- Lời văn tự nhiên, có cấu trúc rõ ràng, dùng thuật ngữ đúng trường phái người dùng chọn nhưng giải thích dễ hiểu.
- Kết luận bằng lời khuyên tích cực, hướng người dùng tới hành động và tư duy phát triển bản thân.
- Luôn kèm `disclaimer`: *"Kết quả chỉ mang tính tham khảo và giải trí, không thay thế cho lời khuyên y tế, tài chính hay pháp lý chuyên nghiệp."*

### Ngôn ngữ

- Mặc định trả kết quả bằng **tiếng Việt**.
- Mở rộng đa ngôn ngữ trong tương lai: thêm trường `language: "vi" | "en"` vào `AiReadingOptions`, chèn vào system prompt yêu cầu AI trả về đúng ngôn ngữ đó.

### Tối ưu Prompt theo trường phái

System prompt chung quy định định dạng JSON đầu ra nghiêm ngặt. User prompt được sinh tự động dựa trên:

1. Trường phái (`school`): đưa vào bảng thuật ngữ và các đường/gò tương ứng.
2. Danh sách mục được chọn (`topics`): chỉ thị AI **chỉ phân tích các mục này**, bỏ qua các mục không được chọn để tiết kiệm token và tăng tốc độ phản hồi.
3. Bàn tay (`hand`): `LEFT` (tiềm năng bẩm sinh, tính cách nội tâm) hoặc `RIGHT` (thực tế phát triển, hiện tại và tương lai theo quan niệm phổ biến).

### Cấu trúc Prompt

**System Prompt (rút gọn minh hoạ)**:

```text
Bạn là chuyên gia nhân tướng học và thuật xem chỉ tay (Palmistry) giàu kinh nghiệm, thấu cảm và khách quan.
Nhiệm vụ của bạn là quan sát kỹ lưỡng ảnh bàn tay được cung cấp và đưa ra bài luận giải chi tiết theo đúng trường phái và các mục được yêu cầu.

YÊU CẦU ĐẦU RA BẮT BUỘC:
- Định dạng JSON hợp lệ duy nhất, tuân thủ schema PalmResult.
- Không bọc JSON trong bất kỳ thẻ markdown nào khác ngoài ```json ... ``` (hoặc trả raw JSON nếu model hỗ trợ json_object mode).
- Nếu ảnh không phải bàn tay người, hoặc bàn tay quá mờ/không nhìn rõ các đường chỉ, đặt isPalm: false và ghi rõ rejectReason ("NOT_A_PALM", "TOO_BLURRY", "BAD_LIGHTING").
- Không dự đoán thời điểm tử vong, bệnh tật hiểm nghèo hay thông tin tiêu cực tuyệt đối.
```

**User Prompt**:

```text
Trường phái: [WESTERN | EASTERN | VEDIC]
Tay xem: [LEFT | RIGHT]
Các mục cần phân tích: [danh sách key các section và aspect được chọn]

Hãy phân tích ảnh bàn tay đính kèm và trả về JSON theo đúng cấu trúc yêu cầu.
```

### Dự toán Token

| Nội dung | Chi phí Token (ước tính) |
| --- | --- |
| System Prompt & Rules | ~400 tokens |
| User Prompt (danh sách mục) | ~100 tokens |
| Ảnh bàn tay (Groq Vision / Gemini) | ~800 - 1,200 tokens (tuỳ độ phân giải và model) |
| Kết quả phân tích (JSON) | 600 - 1,500 tokens (tuỳ số lượng mục chọn) |
| **Tổng mỗi lần gọi** | **~2,000 - 3,200 tokens** |

Hạn mức `AI_MAX_TOKENS=2000` cho output đủ để chứa trọn vẹn kết quả bói toàn bộ mà không bị cắt cụt JSON (`JSON.parse` thất bại).

## Pipeline Gọi AI & Xử lý Fallback

```
Client POST /readings/scan
         │
         ▼
Tiền xử lý ảnh (Sharp):
resize 1280px, strip EXIF, quality 85
         │
         ▼
Gọi AI chính: Google Gemini API (gemini-3.8-flash)
         │
    ┌────┴────────────────────────┐
    │ Thành công                  │ Thất bại (429 Quota / Timeout / 5xx)
    ▼                             ▼
Sanitize & Validate           Gọi AI dự phòng: Groq (qwen/qwen3.8-27b)
(palmResultSchema)                │
    │                        ┌────┴────────────────────┐
    ▼                        │ Thành công              │ Thất bại
Trả kết quả 201              ▼                         ▼
                         Sanitize & Validate       Hoàn 1 credit vào ví
                         (palmResultSchema)        Ghi nhận FAILED
                             │                     Trả lỗi 503 AI_UNAVAILABLE
                             ▼
                         Trả kết quả 201
```

## Schema Kết quả (PalmResult)

Backend đảm bảo kết quả từ AI được kiểm tra qua `palmResultSchema` (Yup) trước khi lưu vào MongoDB và trả cho client.

| Trường | Kiểu | Ràng buộc |
| --- | --- | --- |
| `isPalm` | boolean | bắt buộc; `false` → reading `REJECTED`, hoàn credit |
| `school` | `WESTERN` \| `EASTERN` \| `VEDIC` | phải trùng trường phái trong request |
| `hand` | `LEFT` \| `RIGHT` | server tự gắn bằng `hand` người dùng chọn trong request, không lấy từ AI |
| `imageQuality` | `GOOD` \| `FAIR` \| `POOR` | `POOR` vẫn trả kết quả, UI gợi ý chụp lại |
| `topics` | string[] | trùng `readings.topics` (server tự gắn, không lấy từ AI) |
| `sections` | array | đúng các mục riêng **được chọn**, đúng thứ tự chuẩn; mảng rỗng nếu không chọn mục riêng nào |
| `sections[].title` | string | ≤ 60 ký tự |
| `aspects` | object | đúng các khía cạnh **được chọn**; object rỗng nếu không chọn khía cạnh nào |
| `summary` | string | ≤ 300 ký tự |
| mọi chuỗi khác | string | ≤ 800 ký tự |

**Xử lý lỗi nhà cung cấp**: HTTP 429 hoặc 5xx từ Gemini → thử `AI_FALLBACK_PROVIDER` (Groq) một lần; vẫn lỗi hoặc quá `AI_TIMEOUT_MS` → reading `FAILED`, hoàn credit, trả `AI_UNAVAILABLE`.
