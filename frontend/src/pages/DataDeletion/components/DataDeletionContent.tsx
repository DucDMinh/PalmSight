export const DataDeletionContent = () => {
  return (
    <article className="w-full max-w-[640px] text-left font-mono">
      {/* Title & Metadata */}
      <h1 className="text-3xl sm:text-[38px] font-bold text-ink leading-tight mb-2 tracking-normal">
        Xoá dữ liệu của bạn
      </h1>
      <div className="text-sm text-mute mb-8">Cập nhật: 15/10/2026</div>

      {/* Lead body */}
      <p className="text-base text-body leading-relaxed mb-10">
        Bạn có quyền yêu cầu xoá tài khoản và toàn bộ dữ liệu cá nhân liên quan bất cứ lúc nào.
      </p>

      {/* Section: Cách xoá */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Quy trình yêu cầu xoá (Thủ công qua email)
        </h2>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>
            Gửi email từ chính địa chỉ email của tài khoản tới:{" "}
            <strong className="text-ink">palmsight.app@gmail.com</strong>.
          </span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>
            Tiêu đề email:{" "}
            <code className="text-xs sm:text-sm bg-surface-card px-1.5 py-0.5 rounded text-ink">
              [Yêu cầu xoá dữ liệu] - &lt;email của bạn&gt;
            </code>
          </span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>
            Đối với tài khoản chỉ đăng nhập Facebook (không có email): Vào mục{" "}
            <strong className="text-ink">Tài khoản</strong>, bấm sao chép{" "}
            <strong className="text-ink">ID tài khoản</strong> và gửi kèm trong email để đội ngũ kỹ thuật đối soát.
          </span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5 last:border-b-0">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>
            Ứng dụng <strong className="text-ink">không có nút tự xoá tự phục vụ</strong> trong ứng dụng nhằm bảo vệ dữ liệu và ngăn ngừa việc lợi dụng vòng xoá – tạo tài khoản (theo quy định ADR-0009).
          </span>
        </div>
      </section>

      {/* Section: Thời gian xử lý */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Thời gian xử lý
        </h2>
        <p className="text-base text-body leading-relaxed">
          Đội ngũ kỹ thuật PalmSight sẽ tiếp nhận, xác minh danh tính và hoàn tất xoá dữ liệu trong vòng{" "}
          <strong className="text-ink">30 ngày</strong> kể từ khi nhận được yêu cầu hợp lệ.
        </p>
      </section>

      {/* Section: Những gì bị xoá */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Những gì bị xoá vĩnh viễn
        </h2>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[-]</span>
          <span>Lịch sử các bài bói và toàn bộ kết quả luận giải chi tiết.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[-]</span>
          <span>Tên hiển thị, tên đăng nhập, địa chỉ email, ảnh đại diện.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[-]</span>
          <span>Mật khẩu và thông tin xác thực danh tính.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5 last:border-b-0">
          <span className="font-bold text-ink shrink-0">[-]</span>
          <span>Mọi phiên đăng nhập trên toàn bộ thiết bị (thu hồi token ngay lập tức).</span>
        </div>
      </section>

      {/* Section: Ảnh lòng bàn tay */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Ảnh lòng bàn tay
        </h2>
        <p className="text-base text-body leading-relaxed">
          Máy chủ PalmSight <strong className="text-ink">hoàn toàn không lưu trữ ảnh chụp lòng bàn tay</strong> trên máy chủ hay cơ sở dữ liệu (theo quyết định kiến trúc ADR-0010). Ảnh chỉ được phân tích tạm thời trên bộ nhớ đệm (RAM) trong quá trình xử lý với AI và bị xoá ngay lập tức. Mọi thông tin vị trí EXIF đều bị loại bỏ trước khi gửi.
        </p>
      </section>

      {/* Section: Những gì được giữ lại & Cảnh báo khi đăng ký lại */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Những gì được giữ lại & Cảnh báo khi đăng ký lại
        </h2>
        <p className="text-base text-body leading-relaxed mb-4">
          Để ngăn ngừa việc lợi dụng chính sách tặng thưởng credits đăng ký và giới thiệu, chúng tôi lưu giữ một chuỗi mã băm một chiều bảo mật (HMAC-SHA256) của email hoặc ID mạng xã hội đã xoá trong bảng <code className="text-xs sm:text-sm bg-surface-card px-1 rounded text-ink">deleted_identities</code>. Mã băm này không chứa thông tin nhận dạng gốc và không thể đảo ngược.
        </p>
        <div className="p-3 bg-surface-card/60 border border-hairline text-sm text-ink rounded">
          <p className="font-bold mb-1">[!] Cảnh báo khi tạo lại tài khoản:</p>
          <p className="text-body leading-relaxed">
            Nếu bạn đăng ký lại bằng địa chỉ email hoặc tài khoản Google/Facebook đã từng bị xoá, bạn vẫn có thể sử dụng bình thường nhưng <strong className="text-ink">tài khoản sẽ bắt đầu với 0 credit</strong> (không nhận 3 credits quà tặng ban đầu) và <strong className="text-ink">không được quyền nhập mã giới thiệu</strong> của người khác (theo ADR-0009).
          </p>
        </div>
      </section>
    </article>
  );
};

export default DataDeletionContent;
