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
          .join(
            ", "
          )}. Mỗi mục phải có "observation" mô tả chi tiết hình thái nhìn thấy trên ảnh (4-6 câu, 350-900 ký tự) và "meaning" luận giải chuyên sâu đa chiều theo trường phái (6-10 câu, 600-1800 ký tự).`;

  const aspectsInstruction =
    requestedAspects.length === 0
      ? 'Khía cạnh cuộc sống (aspects): Người dùng KHÔNG chọn mục nào trong nhóm này -> BẮT BUỘC trả về object rỗng: "aspects": {}'
      : `Khía cạnh cuộc sống (aspects): BẮT BUỘC phân tích và điền đầy đủ các key sau trong object "aspects": ${requestedAspects
          .map((a) => `${a.key} (${a.label})`)
          .join(
            ", "
          )}. KHÔNG ĐƯỢC để trống aspects! Mỗi khía cạnh phải viết thành đoạn văn luận giải sâu sắc, chi tiết (6-10 câu, 600-1800 ký tự), liên kết cụ thể các dấu hiệu trên bàn tay với vận trình thực tế.`;

  const sectionsSchemaPart =
    requestedSections.length === 0
      ? `  "sections": [],`
      : `  "sections": [
    {
      "key": string (${requestedSections.map((s) => `"${s.key}"`).join(" | ")}),
      "title": string (tên tiêu đề tiếng Việt của mục),
      "observation": string (mô tả tỉ mỉ, chi tiết các đặc điểm nhìn thấy trên bàn tay, 4-6 câu, tối đa 2500 ký tự),
      "meaning": string (luận giải chuyên sâu, giàu chiều sâu huyền học theo trường phái, 6-10 câu, tối đa 3500 ký tự)
    }
  ],`;

  const aspectsSchemaPart =
    requestedAspects.length === 0
      ? `  "aspects": {},`
      : `  "aspects": {
${requestedAspects
  .map(
    (a) =>
      `    "${a.key}": string (luận giải chuyên sâu khía cạnh ${a.label}, 6-10 câu, tối đa 3500 ký tự)`
  )
  .join(",\n")}
  },`;

  const schemaDescription = `{
  "isPalm": boolean (true nếu là ảnh chụp lòng bàn tay người đủ rõ để đọc chỉ tay, false nếu ảnh không phải hoặc quá mờ/tối),
  "rejectReason": string | null (lý do từ chối thân thiện nếu isPalm = false, ngược lại null),
  "imageQuality": "GOOD" | "FAIR" | "POOR",
  "summary": string (đoạn tổng luận sâu sắc khái quát toàn bộ tướng tay, khí chất và vận mệnh chủ đạo, 4-6 câu, tối đa 1500 ký tự),
${sectionsSchemaPart}
${aspectsSchemaPart}
  "advice": string (lời khuyên kim chỉ nam sâu sắc, thiết thực về dưỡng tâm, phát huy sở trường và nắm bắt vận hội, 5-8 câu, tối đa 3000 ký tự),
  "disclaimer": "Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn."
}`;

  return `Trường phái: ${params.school}. Tay: ${handVi}. Mục cần bói: ${topicsText}.
Hướng dẫn chi tiết:
- ${sectionsInstruction}
- ${aspectsInstruction}
- Hãy viết bài luận giải thật sâu sắc, giàu chi tiết, phân tích kỹ lưỡng từng đường nét, gò bàn tay và các mối liên hệ tương hỗ thay vì nhận xét ngắn gọn.

Schema JSON bắt buộc:
${schemaDescription}`;
}

export { COMMON_SYSTEM_PROMPT, WESTERN_PROMPT, EASTERN_PROMPT, VEDIC_PROMPT };
