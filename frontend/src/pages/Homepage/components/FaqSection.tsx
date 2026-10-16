import { useState } from "react";
import { FaqItem } from "../types";

export const FAQ_DATA: FaqItem[] = [
  {
    question: "Ảnh của tôi có được lưu không?",
    answer:
      "Máy chủ xử lý ảnh tạm thời trên RAM để phân tích AI và không lưu trữ trên máy chủ hay dịch vụ đám mây nào theo ADR-0010, đảm bảo quyền riêng tư tuyệt đối.",
  },
  {
    question: "Kết quả có chính xác không?",
    answer:
      "Kết quả mang tính chiêm đoán giải trí và tham khảo dựa trên cổ thư kết hợp AI Vision.",
  },
  {
    question: "Nếu AI bị lỗi thì sao?",
    answer:
      "Hệ thống tự động hoàn trả 1 credit vào ví của bạn nếu ảnh không đạt yêu cầu hoặc xảy ra lỗi.",
  },
];

export const FaqSection = () => {
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({
    0: true,
  });

  const toggleItem = (index: number) => {
    setOpenIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <section
      id="hoi-dap"
      className="max-w-[960px] mx-auto px-4 mt-[96px] pt-[24px] hairline-top text-left scroll-mt-16 w-full"
    >
      <h2 className="text-[16px] leading-[1.5] font-[700] text-[#201d1d] mb-4">
        Hỏi đáp
      </h2>
      <div className="space-y-0">
        {FAQ_DATA.map((item, index) => {
          const isOpen = !!openIndices[index];

          return (
            <div key={item.question} className="py-[12px] hairline-bottom">
              <button
                type="button"
                onClick={() => toggleItem(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                className="w-full text-left text-[16px] leading-[1.5] font-[700] text-[#201d1d] cursor-pointer flex items-start gap-1.5 focus:outline-none"
              >
                <span className="shrink-0 select-none">
                  {isOpen ? "−" : "+"}
                </span>
                <span>{item.question}</span>
              </button>
              {isOpen && (
                <div
                  id={`faq-answer-${index}`}
                  data-testid={`faq-answer-${index}`}
                  className="text-[16px] leading-[1.5] font-[400] text-[#424245] mt-1 pl-4"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FaqSection;
