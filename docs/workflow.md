# workflow — Luồng xử lý

## 1. Đăng nhập Google / Facebook

```mermaid
flowchart TB
    sdk["Client lấy token từ SDK<br/>Google GIS / Facebook SDK"]
    post["POST /auth/:provider<br/>idToken | accessToken"]
    verify["Server xác minh token<br/>gọi Google / Facebook API"]
    invalid["401 OAUTH_INVALID_TOKEN"]
    hasId{"Đã có identity?"}
    emailMatch{"Email trùng user cũ?"}
    create["Tạo user mới<br/>referralCode + identity<br/>+3 credits SIGNUP_BONUS<br/>trong 1 transaction"]
    link["Gộp: thêm identity vào user đó<br/>không cộng thêm credits"]
    existing["Cập nhật profile user cũ<br/>tên, avatar"]
    token["Cấp access token + cookie rt<br/>JWT 15 phút · refresh token 30 ngày, xoay vòng mỗi lần refresh"]
    refScreen["Màn nhập mã giới thiệu<br/>isNewUser = true<br/>điền sẵn từ cookie ref_code"]
    home["Vào trang chủ<br/>isNewUser = false"]

    sdk --> post --> verify
    verify -->|sai| invalid
    verify --> hasId
    hasId -->|có| existing
    hasId -->|chưa| emailMatch
    emailMatch -->|có| link
    emailMatch -->|không| create
    create --> token
    link --> token
    existing --> token
    token -->|mới| refScreen
    token -->|cũ| home

    classDef accent stroke:#2f6fde,stroke-width:2px
    classDef bad stroke:#d64545,stroke-width:2px
    class create accent
    class invalid bad
```

Chỉ nhánh tạo user mới mới cộng 3 credits. Gộp theo email chỉ áp dụng khi provider trả email đã xác minh (Google luôn có, Facebook có thể không), để một người dùng cả hai cách đăng nhập không nhận 6 credits.

## 2. Nhập mã giới thiệu

```mermaid
flowchart TB
    submit["POST /me/referral<br/>body code + Bearer token"]
    validate["Kiểm tra hợp lệ<br/>mã tồn tại, không tự nhập<br/>chưa từng nhập mã<br/>không nhập mã của người mình đã mời"]
    reject["Từ chối 4xx<br/>mã lỗi REFERRAL_*<br/>không ghi dữ liệu"]
    cap{"Chủ mã đã nhận<br/>10 lượt hôm nay?"}
    capped["CAPPED<br/>ghi referral<br/>không cộng credits"]
    rewarded["REWARDED<br/>+2 credits ngay cho chủ mã<br/>ghi REFERRAL_BONUS"]
    done["201 { accepted: true }"]

    submit --> validate
    validate -->|sai| reject
    validate --> cap
    cap -->|có| capped --> done
    cap -->|chưa| rewarded --> done

    classDef accent stroke:#2f6fde,stroke-width:2px
    classDef warn stroke:#e0a100,stroke-width:2px
    classDef bad stroke:#d64545,stroke-width:2px
    class rewarded accent
    class capped warn
    class reject bad
```

Ghi referral, cộng credits và ghi sổ cái chạy trong một MongoDB transaction. Unique index trên `referrals.refereeId` chặn việc một người gửi hai request nhập mã cùng lúc.

## 3. Xem bói

```mermaid
flowchart TB
    choose["Client chọn trường phái<br/>Tây / Đông / Ấn Độ"]
    topics["Tích các mục muốn bói<br/>hoặc Bói toàn bộ<br/>chọn tay trái / phải"]
    capture["Chụp ảnh<br/>khung căn lòng bàn tay<br/>hoặc chọn ảnh có sẵn"]
    post["POST /readings<br/>image, school, topics, hand<br/>header Idempotency-Key"]
    key{"Key đã dùng?"}
    replay["Trả lại reading cũ<br/>không trừ thêm credit"]
    validate["Validate<br/>ảnh ≤ 8 MB · JPEG/PNG/WebP/HEIC<br/>school hợp lệ, topics thuộc school<br/>topics rỗng → điền toàn bộ"]
    badReq["400 / 413 / 415<br/>không trừ credit"]
    spend["Trừ 1 credit + tạo reading<br/>PROCESSING + READING_SPEND<br/>trong 1 transaction"]
    noCredit["402<br/>INSUFFICIENT_CREDITS"]
    ai["Xử lý ảnh + gọi AI<br/>xoay, xoá EXIF, resize 1280 px<br/>prompt theo trường phái + mục đã chọn<br/>Groq → Gemini, timeout 40 s"]
    result{"Kết quả AI?"}
    rejected["REJECTED<br/>hoàn 1 credit<br/>200, gợi ý chụp lại"]
    failed["FAILED<br/>hoàn 1 credit<br/>503 AI_UNAVAILABLE"]
    done["DONE<br/>lưu result, trả 200"]

    choose --> topics --> capture --> post --> key
    key -->|có| replay
    key -->|chưa| validate
    validate -->|sai| badReq
    validate --> spend
    spend -->|hết| noCredit
    spend --> ai --> result
    result -->|ảnh sai| rejected
    result -->|lỗi| failed
    result -->|hợp lệ| done

    classDef accent stroke:#2f6fde,stroke-width:2px
    classDef warn stroke:#e0a100,stroke-width:2px
    classDef bad stroke:#d64545,stroke-width:2px
    class done accent
    class rejected,failed warn
    class badReq,noCredit bad
```

Trừ credit **trước** khi gọi AI, để hai request gửi cùng lúc không thể dùng chung một credit cuối cùng. Hoàn credit ghi `READING_REFUND` kèm `readingId`; unique index đảm bảo mỗi reading chỉ được hoàn một lần.

Nếu server chết giữa chừng, reading bị kẹt ở `PROCESSING`. Reading kẹt quá 2 phút được chuyển sang `FAILED` và hoàn credit. Việc này chạy ở hai chỗ, vì server miễn phí có thể đang ngủ:

- Định kỳ mỗi 5 phút trong lúc API đang chạy, và một lần khi API khởi động.
- Khi người dùng mở lịch sử hoặc chi tiết của reading đó.
