export const TermsContent = () => {
  return (
    <article className="w-full max-w-[640px] text-left font-mono">
      {/* Title & Metadata */}
      <h1 className="text-3xl sm:text-[38px] font-bold text-ink leading-tight mb-2 tracking-normal">
        Điều khoản dịch vụ
      </h1>
      <div className="text-sm text-mute mb-8">Cập nhật: 15/10/2026</div>

      {/* Lead body */}
      <p className="text-base text-body leading-relaxed mb-10">
        Chào mừng bạn đến với PalmSight. Vui lòng đọc kỹ các điều khoản dưới đây trước khi trải nghiệm ứng dụng.
      </p>

      {/* Section: Mục đích giải trí */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Mục đích giải trí
        </h2>
        <p className="text-base text-body leading-relaxed">
          Toàn bộ kết quả bói toán và phân tích đường chỉ tay trên PalmSight được tạo tự động bởi mô hình trí tuệ nhân tạo và chỉ mang tính chất tham khảo, giải trí. Kết quả này hoàn toàn không có giá trị thay thế cho các lời khuyên, chẩn đoán hay tư vấn chuyên môn về y tế, pháp lý, tài chính hoặc tâm lý học.
        </p>
      </section>

      {/* Section: Quy định tài khoản */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Tài khoản người dùng
        </h2>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Mỗi cá nhân chỉ được tạo và sở hữu một tài khoản chính chủ.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Nghiêm cấm hành vi lợi dụng công cụ tự động hoặc tạo tài khoản ảo để gian lận credits.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5 last:border-b-0">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Bạn có trách nhiệm bảo mật mật khẩu và thông tin đăng nhập của mình.</span>
        </div>
      </section>

      {/* Section: Cơ chế Credits */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Chính sách Credits
        </h2>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Mỗi lượt luận giải chỉ tay tiêu tốn chính xác 1 credit.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>Credits khuyến mãi (khi đăng ký hoặc qua mã giới thiệu) không có giá trị quy đổi tiền mặt.</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-baseline gap-2.5 last:border-b-0">
          <span className="font-bold text-ink shrink-0">[+]</span>
          <span>PalmSight có toàn quyền thu hồi credits thu được bất chính hoặc vi phạm điều khoản.</span>
        </div>
      </section>

      {/* Section: Quyền sở hữu trí tuệ */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-hairline mb-4">
          Quyền sở hữu trí tuệ
        </h2>
        <p className="text-base text-body leading-relaxed">
          Giao diện Terminal Minimalist, mã nguồn, phong cách mỹ thuật và toàn bộ nội dung hiển thị thuộc bản quyền độc quyền của PalmSight. Mọi hành vi sao chép, thu thập hoặc khai thác thương mại khi chưa được sự đồng ý bằng văn bản đều bị nghiêm cấm.
        </p>
      </section>
    </article>
  );
};

export default TermsContent;
