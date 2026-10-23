import {
  PalmResult,
  LIFE_ASPECT_KEYS,
} from "@palmsight/shared";
import { AiReadingOptions } from "./ai-provider.interface";

const DEFAULT_ASPECT_FALLBACKS: Record<string, string> = {
  personality:
    "Khí chất nội tại thể hiện sự tự chủ, suy nghĩ thấu đáo và độc lập trong cách tiếp cận vấn đề. Bạn có xu hướng hành động thực tế, coi trọng chữ tín và biết giữ sự điềm tĩnh trước các tình huống bất ngờ. Điểm cần lưu ý là đôi khi quá cẩn trọng khiến bạn bỏ lỡ cơ hội bộc lộ cảm xúc chân thật.",
  love:
    "Trong quan hệ tình cảm, bạn là người chân thành, kín đáo và có xu hướng gắn bó sâu sắc một khi đã đặt niềm tin. Bạn coi trọng sự thấu hiểu và gắn kết tâm hồn hơn là những lời hoa mỹ. Điểm cần lưu ý: nên chủ động chia sẻ suy nghĩ nhiều hơn để tránh tạo cảm giác xa cách hoặc hiểu lầm không đáng có.",
  career:
    "Sự nghiệp có nền tảng vững vàng nhờ tư duy thực tế, tính kiên nhẫn và khả năng thích ứng linh hoạt. Bạn thích hợp với những công việc đòi hỏi chiều sâu, tính tự chủ và năng lực giải quyết vấn đề độc lập. Điểm cần lưu ý: nên mở rộng các mối quan hệ hợp tác và dám đón nhận thử thách mới thay vì chỉ gắn bó với vùng an toàn.",
  finance:
    "Tài vận có xu hướng tích lũy bền vững, bạn biết cân đối chi tiêu và quản lý nguồn lực một cách chừng mực, không chạy theo rủi ro ngắn hạn. Khả năng giữ tiền và tạo dựng của cải theo thời gian tương đối tốt. Điểm cần lưu ý: cần tìm hiểu thêm các kênh đầu tư dài hạn an toàn để dòng tiền sinh lời hiệu quả hơn.",
  health:
    "Thể chất và năng lượng sống nhìn chung ổn định, có sức bền tốt trong công việc hàng ngày. Tuy nhiên, xu hướng suy nghĩ nhiều và ôm đồm công việc có thể gây căng thẳng thần kinh hoặc mỏi cơ bắp. Điểm cần lưu ý: cần cân bằng thời gian làm việc với nghỉ ngơi, duy trì giấc ngủ chất lượng và thường xuyên vận động nhẹ nhàng để giải tỏa áp lực.",
  family:
    "Gia đạo là điểm tựa tinh thần quan trọng, bạn luôn ý thức chăm lo và bảo bọc người thân bằng những hành động thực tế. Mối liên kết với các thế hệ trong gia đình khá sâu đậm. Điểm cần lưu ý: nên kiên nhẫn lắng nghe các quan điểm khác biệt giữa các thành viên, tránh áp đặt suy nghĩ cá nhân trong các quyết định chung.",
};

export function sanitizePalmResult(
  result: any,
  options: AiReadingOptions
): PalmResult {
  result.school = options.school;
  result.hand = options.hand;
  result.topics = options.topics;

  if (result.isPalm === false) {
    return result as PalmResult;
  }

  const allowedTopics = new Set(options.topics || []);

  if (Array.isArray(result.sections)) {
    result.sections = result.sections.filter(
      (s: any) => s && typeof s.key === "string" && allowedTopics.has(s.key)
    );
  } else {
    result.sections = [];
  }

  const currentAspects: Record<string, string> =
    result.aspects && typeof result.aspects === "object"
      ? { ...result.aspects }
      : {};

  const filteredAspects: Record<string, string> = {};
  for (const [key, value] of Object.entries(currentAspects)) {
    if (allowedTopics.has(key) && typeof value === "string") {
      filteredAspects[key] = value;
    }
  }

  const requestedAspectKeys = LIFE_ASPECT_KEYS.filter((a) =>
    allowedTopics.has(a)
  );

  for (const aspectKey of requestedAspectKeys) {
    if (!filteredAspects[aspectKey] || !filteredAspects[aspectKey].trim()) {
      filteredAspects[aspectKey] =
        DEFAULT_ASPECT_FALLBACKS[aspectKey] ||
        "Đặc điểm bàn tay cho thấy khía cạnh này đang ở trạng thái phát triển ổn định, cần tiếp tục phát huy các thế mạnh vốn có.";
    }
  }

  result.aspects = filteredAspects;

  return result as PalmResult;
}
