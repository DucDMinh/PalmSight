import { SchoolItem } from "../types";

export const SCHOOLS_DATA: SchoolItem[] = [
  {
    title: "Chỉ tay phương Tây",
    description: "Dáng tay 4 nguyên tố, các đường chỉ chính và 7 gò",
    aspects: "Tình cảm · Trí tuệ · Sinh mệnh · Định mệnh · Danh vọng",
  },
  {
    title: "Chỉ tay phương Đông",
    description: "Dáng tay ngũ hành, Thiên – Nhân – Địa văn, cung bát quái",
    aspects:
      "Ngũ hành · Thiên văn · Nhân văn · Địa văn · Bát quái · Các ngón tay",
  },
  {
    title: "Chỉ tay Ấn Độ",
    description: "Gò theo 9 hành tinh, đường chính, dấu hiệu đặc biệt",
    aspects: "9 hành tinh · Đường chính · Dấu hiệu đặc biệt · Ngón cái",
  },
];

export const SchoolsSection = () => {
  return (
    <section
      id="truong-phai"
      className="max-w-[960px] mx-auto px-4 mt-[96px] pt-[24px] hairline-top text-left scroll-mt-16 w-full"
    >
      <h2 className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-4">
        Trường phái
      </h2>
      <div className="hairline-border grid grid-cols-1 md:grid-cols-3 rounded-none">
        {SCHOOLS_DATA.map((school, index) => {
          const isLast = index === SCHOOLS_DATA.length - 1;
          const isFirst = index === 0;

          return (
            <div
              key={school.title}
              className={`p-[16px] ${
                !isLast ? "md:hairline-right" : ""
              } ${
                !isFirst ? "border-t md:border-t-0 hairline-top md:border-none" : ""
              }`}
            >
              <div className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-1">
                {school.title}
              </div>
              <div className="text-[16px] leading-[1.5] font-[400] text-[#424245] mb-2">
                {school.description}
              </div>
              <div className="text-[14px] leading-[1.5] font-[400] text-[#646262]">
                {school.aspects}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SchoolsSection;
