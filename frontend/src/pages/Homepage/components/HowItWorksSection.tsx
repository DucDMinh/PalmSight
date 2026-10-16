export const HowItWorksSection = () => {
  const steps = [
    {
      title: "Chọn trường phái",
      desc: "Phương Tây, phương Đông hoặc Ấn Độ.",
    },
    {
      title: "Chụp lòng bàn tay",
      desc: "Bằng camera hoặc ảnh có sẵn.",
    },
    {
      title: "Nhận bài bói",
      desc: "Quan sát, ý nghĩa và lời khuyên.",
    },
  ];

  return (
    <section
      id="cach-hoat-dong"
      className="max-w-[960px] mx-auto px-4 mt-[96px] pt-[24px] hairline-top text-left scroll-mt-16 w-full"
    >
      <h2 className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-4">
        Cách hoạt động
      </h2>
      <div className="space-y-0">
        {steps.map((step) => (
          <div
            key={step.title}
            className="py-[8px] hairline-bottom text-[16px] leading-[1.5]"
          >
            <span className="font-[700] text-[#201d1d]">[+] {step.title}</span>
            <span className="text-[#424245] ml-3">{step.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
