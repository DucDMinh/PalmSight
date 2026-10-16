export const CreditsSection = () => {
  return (
    <section
      id="credits"
      className="max-w-[960px] mx-auto px-4 mt-[96px] pt-[24px] hairline-top text-left scroll-mt-16 w-full"
    >
      <h2 className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-4">
        Credits
      </h2>
      <div className="space-y-0">
        <div className="py-[8px] hairline-bottom text-[16px] leading-[1.5] text-[#424245]">
          <span className="font-[700] text-[#201d1d]">[+] 3 credits</span> khi
          tạo tài khoản
        </div>
        <div className="py-[8px] hairline-bottom text-[16px] leading-[1.5] text-[#424245]">
          <span className="font-[700] text-[#201d1d]">[+] +2 credits</span> mỗi
          khi có người nhập mã giới thiệu của bạn
        </div>
        <div className="py-[8px] hairline-bottom text-[16px] leading-[1.5] text-[#424245]">
          <span className="font-[700] text-[#201d1d]">
            [+] 1 lần xem = 1 credit
          </span>
          , dù chọn bao nhiêu mục
        </div>
      </div>
    </section>
  );
};

export default CreditsSection;
