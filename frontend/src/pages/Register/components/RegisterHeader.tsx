export const RegisterHeader = () => {
  return (
    <section className="w-full md:w-[360px] md:pr-12">
      <h1 className="text-[34px] md:text-[38px] font-bold text-ink leading-tight mb-4 tracking-normal">
        Tạo tài khoản
      </h1>
      <p className="text-base text-body mb-8">
        Xác thực email để nhận 3 credits.
      </p>

      <div className="border-t border-hairline">
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-center">
          <span className="font-bold text-ink mr-2">[+]</span>
          <span>1 lần xem bói = 1 credit</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-center">
          <span className="font-bold text-ink mr-2">[+]</span>
          <span>Chọn phương Tây, phương Đông hoặc Ấn Độ</span>
        </div>
        <div className="py-2.5 border-b border-hairline text-base text-body flex items-center">
          <span className="font-bold text-ink mr-2">[+]</span>
          <span>Xoá ảnh và dữ liệu bất cứ lúc nào</span>
        </div>
      </div>
    </section>
  );
};

export default RegisterHeader;
