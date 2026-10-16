export const PrivacyContent = () => {
  return (
    <article className="w-full max-w-[640px] text-left font-mono">
      {/* Title & Metadata */}
      <h1 className="text-3xl sm:text-[38px] font-bold text-ink leading-tight mb-2 tracking-normal">
        Chính sách riêng tư
      </h1>
      <div className="text-sm text-mute mb-8">Cập nhật: 15/10/2026</div>

      {/* Lead body */}
      <p className="text-base text-body leading-relaxed mb-10">
        PalmSight cam kết bảo vệ dữ liệu cá nhân của người dùng một cách minh bạch, an toàn và có trách nhiệm.
      </p>

      {/* Section: Không lưu ảnh */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Chính sách không lưu trữ ảnh lòng bàn tay
        </h2>
        <p className="text-base text-body leading-relaxed">
          Chúng tôi tuân thủ nguyên tắc quyền riêng tư theo kiến trúc ADR-0010: máy chủ PalmSight{" "}
          <strong className="text-ink">hoàn toàn không lưu trữ ảnh lòng bàn tay</strong> của bạn. Khi bạn tải ảnh lên:
        </p>
        <div className="mt-3">
          <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
            <span className="font-bold text-ink shrink-0">[+]</span>
            <span>Mọi siêu dữ liệu EXIF (vị trí địa lý GPS, dòng máy, thời gian chụp) đều bị xoá bỏ hoàn toàn.</span>
          </div>
          <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
            <span className="font-bold text-ink shrink-0">[+]</span>
            <span>Ảnh chỉ được đưa vào bộ nhớ tạm (RAM) để gửi qua API được mã hóa an toàn tới engine AI.</span>
          </div>
          <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5 last:border-b-0">
            <span className="font-bold text-ink shrink-0">[+]</span>
            <span>Sau khi AI hoàn tất luận giải, dữ liệu ảnh tạm trên RAM bị giải phóng ngay lập tức.</span>
          </div>
        </div>
      </section>

      {/* Section: Dữ liệu cá nhân thu thập */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Dữ liệu chúng tôi thu thập
        </h2>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Thông tin tài khoản: Địa chỉ email, tên người dùng, tên hiển thị.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Nội dung văn bản kết quả bói toán (chỉ bạn mới có quyền xem trong mục Lịch sử).</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5 last:border-b-0">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Nhật ký giao dịch credits và mã giới thiệu liên kết.</span>
        </div>
      </section>

      {/* Section: Chia sẻ bên thứ ba */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Chia sẻ thông tin với bên thứ ba
        </h2>
        <p className="text-base text-body leading-relaxed">
          PalmSight không bán, cho thuê hoặc chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích quảng cáo. Hình ảnh lòng bàn tay chỉ được chuyển tiếp tạm thời tới nhà cung cấp mô hình trí tuệ nhân tạo (Google Gemini hoặc Groq) qua API để sinh kết quả luận giải, tuân thủ các điều khoản bảo mật của nhà cung cấp.
        </p>
      </section>

      {/* Section: Lưu trữ mã băm định danh đã xoá */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Lưu trữ mã băm định danh đã xoá (ADR-0009)
        </h2>
        <p className="text-base text-body leading-relaxed">
          Sau khi tài khoản được xoá theo yêu cầu của bạn, toàn bộ dữ liệu cá nhân sẽ bị xoá vĩnh viễn trong 30 ngày. Chúng tôi chỉ giữ lại một chuỗi mã băm một chiều bảo mật (HMAC-SHA256) của email/ID đăng nhập để ngăn chặn việc nhận lại khuyến mãi đăng ký và mã giới thiệu nhiều lần. Chuỗi băm này không thể giải mã ngược để biết email hoặc danh tính thực của bạn.
        </p>
      </section>
    </article>
  );
};

export default PrivacyContent;
