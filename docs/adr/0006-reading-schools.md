# ADR-0006: Trường phái bói, chọn mục bói và kết quả dạng `sections` chung

- Trạng thái: Accepted
- Ngày: 2026-10-14

## Bối cảnh

Người dùng chọn **một trong ba** trường phái bói: phương Tây, phương Đông hoặc Ấn Độ. Sau đó họ tích các **mục** muốn bói, hoặc chọn bói toàn bộ.

Mỗi trường phái có các mục riêng:

- phương Tây: 4 nguyên tố, 7 gò;
- phương Đông: ngũ hành, cung bát quái;
- Ấn Độ: gò theo hành tinh.

Ngoài ra có các khía cạnh cuộc sống dùng chung cho mọi trường phái: tình cảm, sự nghiệp… Sau này có thể thêm trường phái mới.

## Quyết định

- `POST /readings` bắt buộc có `school`, và có thể kèm `topics` (danh sách mục).
  - Bỏ trống `topics` nghĩa là bói toàn bộ; server điền đủ mọi mục.
  - Mọi lựa chọn đều tốn 1 credit.
- Có hai loại mục, cùng được chọn qua `topics`:
  - **Mục riêng của trường phái**: trả về trong mảng `sections`, mỗi phần tử `{ key, title, observation, meaning }`.
  - **Khía cạnh cuộc sống** (6 mục chung): trả về trong object `aspects`.
- `summary`, `advice`, `disclaimer` luôn có, không cần chọn.
- `packages/shared` định nghĩa một lần cho cả web và API:
  - `READING_SCHOOLS`: tên, mô tả, danh sách mục riêng theo thứ tự chuẩn, và đoạn prompt riêng của từng trường phái;
  - `LIFE_ASPECTS`: 6 khía cạnh cuộc sống.
- Server chuẩn hoá `topics` (bỏ trùng, sắp theo thứ tự chuẩn) rồi lưu vào `readings.topics`.
- Kết quả AI phải có **đúng** các mục đã chọn, không thiếu, không thừa.
- UI vẽ mọi `sections` theo một cách chung (tiêu đề + quan sát + ý nghĩa).

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Mỗi trường phái một schema riêng hoàn toàn | UI phải có một màn kết quả riêng cho mỗi trường phái; thêm trường phái tốn nhiều công |
| Một schema cố định kiểu phương Tây cho mọi trường phái | Ép phương Đông/Ấn Độ vào khái niệm không đúng (4 nguyên tố, 7 gò) |
| Luôn bói toàn bộ, không cho chọn mục | Kết quả dài; người dùng chỉ quan tâm vài mục; tốn token của hạn mức free |
| Tính giá theo số mục | Phức tạp hơn cho người dùng và sổ cái; chưa cần khi chưa bán credits |

## Hệ quả

- Thêm trường phái mới chỉ cần:
  - thêm một phần tử vào `READING_SCHOOLS`;
  - viết prompt cho trường phái đó;
  - thêm ảnh vào bộ đánh giá AI.

  Không phải sửa schema database hay UI.
- Không đổi `key` của trường phái, mục hoặc khía cạnh đã dùng: kết quả cũ trong database đang lưu theo `key` đó.
- Chọn ít mục thì AI trả kết quả ngắn hơn và nhanh hơn. Bói toàn bộ là trường hợp tốn token nhất, cần kiểm tra không vượt `AI_MAX_TOKENS`.
