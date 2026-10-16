export const SampleResultSection = () => {
  return (
    <section
      id="vi-du-ket-qua"
      className="max-w-[960px] mx-auto px-4 mt-[96px] pt-[24px] hairline-top text-left scroll-mt-16 w-full"
    >
      <h2 className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-4">
        Ví dụ kết quả
      </h2>

      {/* Man-page terminal card */}
      <div className="hairline-border bg-[#fdfcfc] p-[24px] rounded-none">
        {/* First line: Title, School, Hand */}
        <div className="text-[14px] leading-[1.5] text-[#646262] font-[400] pb-4 hairline-bottom mb-4 flex justify-between flex-wrap gap-2">
          <span>PALMSIGHT(1)</span>
          <span>Chỉ tay phương Đông</span>
          <span>Tay trái</span>
        </div>

        {/* Tóm tắt */}
        <div className="mb-4">
          <span className="text-[16px] leading-[1.5] font-[700] text-[#201d1d]">
            Tóm tắt:{" "}
          </span>
          <span className="text-[16px] leading-[1.5] font-[400] text-[#424245]">
            Tay Thổ, thực tế và đáng tin cậy. Tình cảm chân thành, chậm mà chắc.
          </span>
        </div>

        {/* Dáng tay ngũ hành */}
        <div className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-2">
          Dáng tay ngũ hành
        </div>
        <div className="space-y-1">
          <div className="text-[16px] leading-[1.5]">
            <span className="font-[700] text-[#201d1d]">[+] Quan sát</span>
            <span className="text-[#424245] ml-3">
              Lòng bàn tay vuông, ngón ngắn và chắc.
            </span>
          </div>
          <div className="text-[16px] leading-[1.5]">
            <span className="font-[700] text-[#201d1d]">[+] Ý nghĩa</span>
            <span className="text-[#424245] ml-3">
              Tay Thổ: thực tế, đáng tin cậy, làm việc đâu ra đó.
            </span>
          </div>
        </div>
      </div>

      {/* Caption note */}
      <div className="text-[14px] leading-[2] text-[#646262] mt-2">
        Ví dụ minh hoạ, không phải kết quả thật.
      </div>
    </section>
  );
};

export default SampleResultSection;
