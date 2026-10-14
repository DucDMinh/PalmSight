# ADR-0003: Groq là nhà cung cấp AI chính

- Trạng thái: Accepted
- Ngày: 2026-10-14

## Bối cảnh

Yêu cầu gốc: dùng API key miễn phí của **Groq** để làm AI bói toán. Groq cấp API key miễn phí và có model đọc được ảnh. Cần một model vision miễn phí hoặc rất rẻ, trả JSON ổn định, độ trễ thấp.

## Quyết định

- Nhà cung cấp chính: **Groq**, qua API tương thích OpenAI (`/chat/completions`, ảnh gửi dạng base64 data URL, JSON mode).
- Dự phòng: **Google Gemini API** (free tier) khi Groq trả 429/5xx hoặc timeout.
- Code nghiệp vụ chỉ biết interface `AiProvider.readPalm(image, options) → PalmResult`; chọn provider và model bằng biến môi trường.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn làm chính |
| --- | --- |
| OpenAI / Anthropic | Chất lượng tốt nhưng không có free tier lâu dài |
| Tự host model vision (Ollama) | Cần GPU, tốn chi phí và công vận hành |
| Chỉ dùng Gemini | Dùng được; giữ làm dự phòng để không phụ thuộc một hạn mức miễn phí |

## Hệ quả

- Free tier có giới hạn request/token mỗi phút và mỗi ngày → cần rate limit theo user và fallback.
- Tên model vision trên Groq thay đổi theo thời gian; phải kiểm tra lại khi triển khai và khi có thông báo ngừng hỗ trợ model.
- Ảnh người dùng được gửi tới bên thứ ba → phải nêu trong chính sách quyền riêng tư và xin đồng ý.
