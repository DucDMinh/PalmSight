import {
  PalmResult,
  LIFE_ASPECT_KEYS,
  LIFE_ASPECTS_MAP,
} from "@palmsight/shared";
import { AiReadingOptions } from "./ai-provider.interface";

export function parseAiJsonResponse(rawContent: string): any {
  const trimmed = rawContent.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Invalid JSON response from AI provider");
  }
}

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
      const config = LIFE_ASPECTS_MAP[aspectKey];
      const label = config?.label || aspectKey;
      filteredAspects[
        aspectKey
      ] = `Dựa trên tổng quan bàn tay, về ${label.toLowerCase()}, bạn có nhiều tiềm năng tích cực và nên tiếp tục kiên định phát huy sở trường để đạt kết quả tốt đẹp.`;
    }
  }

  result.aspects = filteredAspects;

  return result as PalmResult;
}
