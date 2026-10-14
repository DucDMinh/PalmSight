# ADR-0004: Xử lý xem bói đồng bộ trong MVP

- Trạng thái: Accepted
- Ngày: 2026-10-14

## Bối cảnh

Một lần xem bói gồm: upload ảnh, xử lý ảnh, gọi AI (vài giây tới vài chục giây), lưu kết quả. Có thể làm đồng bộ (client chờ trong một request) hoặc bất đồng bộ (trả `202`, client polling hoặc nhận push).

## Quyết định

- `POST /readings` xử lý **đồng bộ**, timeout phía server 45 giây (AI 40 giây).
- Trừ credit trước khi gọi AI, hoàn credit nếu lỗi, trong cùng request.
- Job chạy mỗi 5 phút chuyển reading kẹt ở `PROCESSING` quá 2 phút sang `FAILED` và hoàn credit, phòng khi server chết giữa chừng.
- Client chống gửi lặp bằng `Idempotency-Key`.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Hàng đợi (BullMQ) + polling `GET /readings/{id}` | Thêm worker, thêm trạng thái UI; chưa cần khi lưu lượng thấp |
| Server-Sent Events / WebSocket | Phức tạp hơn polling, chưa cần |

## Hệ quả

- Nền tảng deploy phải cho phép request dài ≥ 45 giây (kiểm tra giới hạn của proxy / serverless). Vì vậy API chạy dạng container thường trực, không chạy serverless.
- Khi lưu lượng tăng hoặc thêm tính năng tốn thời gian, chuyển sang hàng đợi: schema `readings` (trạng thái `PROCESSING`) đã sẵn sàng cho việc đó.
