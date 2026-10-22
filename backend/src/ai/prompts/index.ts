import {
  ReadingSchool,
  HandOrientation,
  READING_SCHOOLS,
  LIFE_ASPECTS,
} from "@palmsight/shared";
import { COMMON_SYSTEM_PROMPT } from "./common";
import { WESTERN_PROMPT } from "./western";
import { EASTERN_PROMPT } from "./eastern";
import { VEDIC_PROMPT } from "./vedic";

export const SCHOOL_PROMPTS: Record<ReadingSchool, string> = {
  [ReadingSchool.WESTERN]: WESTERN_PROMPT,
  [ReadingSchool.EASTERN]: EASTERN_PROMPT,
  [ReadingSchool.VEDIC]: VEDIC_PROMPT,
};

export function buildSystemPrompt(school: ReadingSchool): string {
  const schoolPrompt = SCHOOL_PROMPTS[school];
  if (!schoolPrompt) {
    throw new Error(`Chưa cấu hình prompt cho trường phái ${school}`);
  }
  return `${COMMON_SYSTEM_PROMPT}\n\n${schoolPrompt}`;
}

export function buildUserPrompt(params: {
  school: ReadingSchool;
  hand: HandOrientation;
  topics: string[];
}): string {
  const handVi = params.hand === HandOrientation.LEFT ? "trái" : "phải";
  const topicsText = params.topics.join(", ");

  const requestedSections = (
    READING_SCHOOLS[params.school]?.sections || []
  ).filter((s) => params.topics.includes(s.key));
  const requestedAspects = LIFE_ASPECTS.filter((a) =>
    params.topics.includes(a.key)
  );

  const sectionsInstruction =
    requestedSections.length === 0
      ? 'Mục đường chỉ & dấu hiệu (sections): Người dùng KHÔNG chọn mục nào trong nhóm này -> BẮT BUỘC trả về mảng rỗng: "sections": []'
      : `Mục đường chỉ & dấu hiệu (sections): BẮT BUỘC CHỈ phân tích đúng các mục sau: ${requestedSections
          .map((s) => `${s.key} (${s.title})`)
          .join(", ")}`;

  const aspectsInstruction =
    requestedAspects.length === 0
      ? 'Khía cạnh cuộc sống (aspects): Người dùng KHÔNG chọn mục nào trong nhóm này -> BẮT BUỘC trả về object rỗng: "aspects": {}'
      : `Khía cạnh cuộc sống (aspects): BẮT BUỘC phân tích và điền đầy đủ các key sau trong object "aspects": ${requestedAspects
          .map((a) => `${a.key} (${a.label})`)
          .join(", ")}. KHÔNG ĐƯỢC để trống aspects!`;

  const sectionsSchemaPart =
    requestedSections.length === 0
      ? `  "sections": [], // người dùng KHÔNG chọn mục nào trong nhóm này, BẮT BUỘC trả về mảng rỗng []`
      : `  "sections": [
    // BẮT BUỘC CHỈ phân tích đúng các mục: ${requestedSections.map((s) => s.key).join(", ")}
    {
      "key": string, // một trong: ${requestedSections.map((s) => `"${s.key}"`).join(", ")}
      "title": string, // tên tiêu đề tiếng Việt của mục
      "observation": string, // mô tả khách quan các đặc điểm nhìn thấy trên bàn tay (tối đa 800 ký tự)
      "meaning": string // diễn giải ý nghĩa theo trường phái, nêu cả điểm cần lưu ý nếu có dấu hiệu tương ứng (tối đa 800 ký tự)
    }
  ],`;

  const aspectsSchemaPart =
    requestedAspects.length === 0
      ? `  "aspects": {}, // người dùng KHÔNG chọn khía cạnh nào, BẮT BUỘC trả về object rỗng {}`
      : `  "aspects": {
${requestedAspects
  .map(
    (a) =>
      `    "${a.key}": string // bắt buộc: diễn giải khía cạnh ${a.label}, nêu cả điểm cần lưu ý nếu có dấu hiệu tương ứng (tối đa 800 ký tự)`
  )
  .join(",\n")}
  },`;

  const schemaDescription = `{
  "isPalm": boolean, // bắt buộc: true nếu là ảnh chụp lòng bàn tay người đủ rõ để đọc chỉ tay, false nếu ảnh không phải hoặc quá mờ/tối
  "rejectReason": string | null, // lý do từ chối thân thiện nếu isPalm = false, ngược lại null
  "imageQuality": "GOOD" | "FAIR" | "POOR", // chất lượng ảnh
  "summary": string, // tóm tắt tổng quan, phản ánh đúng cả điểm thuận lợi lẫn điểm cần lưu ý, tối đa 300 ký tự
${sectionsSchemaPart}
${aspectsSchemaPart}
  "advice": string, // 2-4 lời khuyên thực tế, cụ thể, bám vào các điểm cần lưu ý đã nêu (tối đa 800 ký tự)
  "disclaimer": "Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn."
}`;

  return `Trường phái: ${params.school}. Tay: ${handVi}. Mục cần bói: ${topicsText}.
Hướng dẫn chi tiết:
- ${sectionsInstruction}
- ${aspectsInstruction}

Schema JSON bắt buộc:
${schemaDescription}`;
}

export { COMMON_SYSTEM_PROMPT, WESTERN_PROMPT, EASTERN_PROMPT, VEDIC_PROMPT };