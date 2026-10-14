# screens — Màn hình và trạng thái

App thiết kế mobile-first (chiều rộng 360–430 px), chạy dạng PWA. Thanh dưới cùng có 3 tab: **Xem bói**, **Lịch sử**, **Tài khoản**; số credits luôn hiện ở góc trên.

## Sơ đồ điều hướng

```mermaid
flowchart LR
    landing["/ Landing"] --> login["/login"]
    ref["/r/:code"] -->|"lưu cookie ref_code"| login
    login -->|user mới| enterRef["/referral/enter"]
    login -->|user cũ| scan["/scan"]
    enterRef --> scan
    scan --> result["/readings/:id"]
    scan -->|hết credits| invite["/referral"]
    history["/readings"] --> result
    account["/account"] --> wallet["/wallet"]
    account --> invite
    account -->|chưa nhập mã| enterRef
```

## Danh sách màn hình

| Route | Màn hình | Cần đăng nhập | API dùng |
| --- | --- | --- | --- |
| `/` | Landing: giới thiệu, 3 trường phái, nút bắt đầu, ví dụ kết quả | Không | — |
| `/r/:code` | Link giới thiệu: lưu mã vào cookie rồi chuyển `/login` | Không | — |
| `/login` | Nút Google, nút Facebook, điều khoản | Không | `POST /auth/google`, `POST /auth/facebook` |
| `/referral/enter` | Nhập mã giới thiệu (điền sẵn nếu có), nút Bỏ qua | Có | `GET /me`, `POST /me/referral` |
| `/scan` | Chọn trường phái → chọn mục muốn bói → chọn tay → chụp ảnh → gửi | Có | `POST /readings` |
| `/readings/:id` | Kết quả bói | Có | `GET /readings/{id}` |
| `/readings` | Lịch sử các lần xem | Có | `GET /readings` |
| `/wallet` | Số dư và lịch sử cộng/trừ credits | Có | `GET /me`, `GET /me/credit-transactions` |
| `/referral` | Mã của tôi, nút copy/chia sẻ, danh sách người đã mời | Có | `GET /me`, `GET /me/referrals` |
| `/account` | Hồ sơ, nhập mã giới thiệu (nếu chưa nhập), đăng xuất, xoá tài khoản | Có | `GET /me`, `POST /auth/logout`, `DELETE /me` |
| `/privacy`, `/terms`, `/data-deletion` | Chính sách, điều khoản, hướng dẫn xoá dữ liệu | Không | — |

## Trạng thái từng màn hình chính

### `/scan`

Bước 1 — **Chọn trường phái**: 3 thẻ, mỗi thẻ có tên, một câu mô tả và các mục sẽ được bói. Nội dung lấy từ `READING_SCHOOLS` trong `@palmsight/shared`; app nhớ lựa chọn lần trước.

| Trường phái | Mô tả ngắn trên thẻ |
| --- | --- |
| Chỉ tay phương Tây | Dáng tay 4 nguyên tố, các đường chỉ chính và 7 gò |
| Chỉ tay phương Đông | Dáng tay ngũ hành, Thiên – Nhân – Địa văn, cung bát quái |
| Chỉ tay Ấn Độ | Gò theo 9 hành tinh, đường chính, dấu hiệu đặc biệt |

Bước 2 — **Chọn mục muốn bói**: danh sách checkbox chia hai nhóm, lấy từ `READING_SCHOOLS` và `LIFE_ASPECTS`.

```text
[x] Bói toàn bộ

Đường chỉ & dấu hiệu (theo trường phái phương Đông)
[ ] Dáng tay ngũ hành      [ ] Thiên văn
[ ] Nhân văn               [ ] Địa văn
[ ] Cung bát quái          [ ] Các ngón tay

Khía cạnh cuộc sống
[ ] Tính cách   [ ] Tình cảm   [ ] Sự nghiệp
[ ] Tài chính   [ ] Sức khoẻ   [ ] Gia đạo
```

| Hành vi | Chi tiết |
| --- | --- |
| Mặc định | "Bói toàn bộ" được tích sẵn, các mục bên dưới hiện tích nhưng mờ |
| Bỏ tích "Bói toàn bộ" | Các mục bật lên để chọn từng mục |
| Tích đủ mọi mục bằng tay | Tự chuyển về "Bói toàn bộ" |
| Không có mục nào được tích | Nút **Tiếp tục** bị khoá, hiện "Chọn ít nhất 1 mục" |
| Đổi trường phái | Giữ các khía cạnh đã chọn; mục riêng của trường phái cũ bị bỏ |
| Ghi chú giá | Hiện cố định "Giá 1 credit, dù chọn bao nhiêu mục" |

App nhớ lựa chọn lần trước cho từng trường phái.

Bước 3 — **Chọn tay** trái/phải. Với trường phái phương Đông, hiện gợi ý "Nam xem tay trái, nữ xem tay phải".

Bước 4 — **Chụp ảnh**:

| Trạng thái | Hiển thị |
| --- | --- |
| Chưa cấp quyền camera | Giải thích vì sao cần camera + nút cấp quyền + nút "Chọn ảnh có sẵn" |
| Camera bị từ chối / không hỗ trợ | Chỉ còn nút chọn ảnh (`<input capture="environment">`) |
| Sẵn sàng | Khung viền hình bàn tay, gợi ý "Đủ sáng, xoè tay, lòng bàn tay hướng vào camera" |
| Đã chụp | Xem lại ảnh, nút **Chụp lại** / **Xem bói (−1 credit)**, checkbox đồng ý gửi ảnh cho AI. Chưa tích checkbox thì nút gửi bị khoá; tích rồi thì gửi `aiConsent=true` |
| Đang phân tích | Hoạt ảnh chờ, câu "Đang đọc đường chỉ tay…", khoá nút gửi; có thể mất tới ~40 giây |
| Hết credits (0) | Nút gửi bị khoá; banner "Mời bạn bè nhập mã của bạn để nhận 2 credits" dẫn tới `/referral` |
| `402` từ server | Như trên, đồng bộ lại số dư |
| `REJECTED` | "Không nhìn rõ lòng bàn tay" + `rejectReason` + "Đã hoàn 1 credit" + nút chụp lại |
| `AI_UNAVAILABLE` | "Hệ thống bận, đã hoàn 1 credit. Thử lại sau ít phút." Nút thử lại tạo lần xem mới, với `Idempotency-Key` mới |
| Mất mạng / hết 60 giây chưa có response | "Mất kết nối" + nút thử lại; thử lại dùng **cùng** `Idempotency-Key` |
| `409 READING_IN_PROGRESS` | Giữ màn "Đang phân tích", gọi `GET /readings/{readingId}` mỗi 3 giây cho tới khi xong, rồi hiện kết quả như bình thường |

### `/readings/:id`

Thứ tự khối:

1. Ảnh thu nhỏ, nhãn trường phái và nhãn "Toàn bộ" hoặc "N mục".
2. `summary`.
3. Các `sections` đã chọn, theo đúng thứ tự, mỗi mục gồm "Quan sát" và "Ý nghĩa". Ẩn khối này nếu không chọn mục riêng nào.
4. Các khía cạnh cuộc sống đã chọn. Ẩn khối này nếu không chọn khía cạnh nào.
5. Lời khuyên.
6. **Câu miễn trừ.**
7. Nút "Bói thêm mục khác / trường phái khác (−1 credit)": mở lại bước chọn, dùng lại ảnh vừa chụp nếu còn trên máy.
8. Nút chia sẻ (chỉ phần chữ, không kèm ảnh tay) và nút xoá. Bấm xoá → hộp xác nhận → `DELETE /readings/{id}` → quay về `/readings`. Reading đã xoá biến mất khỏi lịch sử và không mở lại được.

UI vẽ `sections` theo cách chung: tiêu đề + quan sát + ý nghĩa. Vì vậy thêm trường phái mới không cần sửa màn hình này.

Nếu `imageQuality = POOR`: banner "Ảnh hơi mờ, kết quả có thể chưa chính xác".

### `/referral/enter`

| Trạng thái | Hiển thị |
| --- | --- |
| Có cookie `ref_code` | Ô mã điền sẵn, nút **Xác nhận** |
| Không có mã | Ô trống, nút **Bỏ qua** nổi bật hơn |
| `201` | "Đã ghi nhận mã của {displayName}" rồi chuyển `/scan` |
| `REFERRAL_CODE_NOT_FOUND` | "Mã không tồn tại, kiểm tra lại" |
| `REFERRAL_SELF` | "Bạn không thể nhập mã của chính mình" |
| `REFERRAL_ALREADY_USED` | "Tài khoản đã nhập mã giới thiệu trước đó" |
| `REFERRAL_CYCLE` | "Không thể nhập mã của người bạn đã mời" |

Màn này mở được bất cứ lúc nào từ `/account`, miễn là `GET /me` trả `referral.canEnterCode = true`.

## Nguyên tắc chung

- Số credits cập nhật ngay từ `creditBalance` trong response, không đợi tải lại.
- Mọi thao tác trừ credit hiện rõ "−1 credit" trên nút.
- Mọi lỗi mạng: thông báo tiếng Việt, có nút thử lại. Với `POST /readings`: chỉ dùng **cùng** `Idempotency-Key` khi không nhận được response; đã nhận response thì lần sau dùng key mới.
- Lần đầu mở app sau khi server miễn phí ngủ có thể chậm 30–60 giây: hiện màn chờ "Đang đánh thức máy chủ…" thay vì báo lỗi.
- Văn phong: thân thiện, ngắn gọn, xưng "bạn".
