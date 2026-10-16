import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigService } from "@nestjs/config";
import { ReadingSchool, HandOrientation } from "@palmsight/shared";
import { GroqAiProvider } from "../src/ai/groq-ai.provider";
import { GeminiAiProvider } from "../src/ai/gemini-ai.provider";
import { AiService } from "../src/ai/ai.service";

describe("US-AI-001: AI Vision Provider & Fallback Pipeline", () => {
  let configService: ConfigService;
  let groqProvider: GroqAiProvider;
  let geminiProvider: GeminiAiProvider;
  let aiService: AiService;

  const mockValidPalmResult = {
    isPalm: true,
    rejectReason: null,
    school: ReadingSchool.EASTERN,
    hand: HandOrientation.LEFT,
    imageQuality: "GOOD",
    topics: ["nguHanh", "thienVan", "love"],
    sections: [
      {
        key: "nguHanh",
        title: "Dáng tay ngũ hành",
        observation: "Lòng bàn tay vuông vức, ngón tay đầy đặn",
        meaning: "Mệnh Thổ: thực tế, kiên định",
      },
      {
        key: "thienVan",
        title: "Thiên văn",
        observation: "Đường thiên văn sâu và dài tới gò Mộc Tinh",
        meaning: "Tình cảm chân thành, sâu sắc",
      },
    ],
    aspects: {
      love: "Tình cảm thuận lợi, gắn kết",
    },
    summary: "Bàn tay phú quý, cuộc sống ổn định và bền vững.",
    advice: "Duy trì sự kiên nhẫn trong các quyết định lớn.",
    disclaimer: "Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn.",
  };

  beforeEach(() => {
    configService = new ConfigService({
      AI_PROVIDER: "groq",
      AI_FALLBACK_PROVIDER: "gemini",
      AI_MODEL: "qwen/qwen3.8-27b",
      AI_FALLBACK_MODEL: "gemini-2.5-flash",
      GROQ_API_KEY: "test-groq-key",
      GEMINI_API_KEY: "test-gemini-key",
      AI_TIMEOUT_MS: "2000",
    });

    groqProvider = new GroqAiProvider(configService);
    geminiProvider = new GeminiAiProvider(configService);
    aiService = new AiService(configService, groqProvider, geminiProvider);

    vi.restoreAllMocks();
  });

  it("GroqAiProvider successfully parses and validates valid PalmResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockValidPalmResult),
              },
            },
          ],
        }),
      })
    );

    const result = await groqProvider.readPalm("data:image/jpeg;base64,xxxx", {
      school: ReadingSchool.EASTERN,
      topics: ["nguHanh", "thienVan", "love"],
      hand: HandOrientation.LEFT,
    });

    expect(result.isPalm).toBe(true);
    expect(result.school).toBe(ReadingSchool.EASTERN);
    expect(result.hand).toBe(HandOrientation.LEFT);
    expect(result.sections?.length).toBe(2);
    expect(result.disclaimer).toContain("Kết quả mang tính giải trí");
  });

  it("GeminiAiProvider successfully parses and validates valid PalmResult", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockValidPalmResult) }],
              },
            },
          ],
        }),
      })
    );

    const result = await geminiProvider.readPalm(
      "data:image/jpeg;base64,xxxx",
      {
        school: ReadingSchool.EASTERN,
        topics: ["nguHanh", "thienVan", "love"],
        hand: HandOrientation.LEFT,
      }
    );

    expect(result.isPalm).toBe(true);
    expect(result.school).toBe(ReadingSchool.EASTERN);
    expect(result.hand).toBe(HandOrientation.LEFT);
  });

  it("AiService falls back to Gemini when Groq throws HTTP 429 or network failure", async () => {
    vi.spyOn(groqProvider, "readPalm").mockRejectedValue(
      new Error("Groq API error HTTP 429: Rate limit exceeded")
    );
    vi.spyOn(geminiProvider, "readPalm").mockResolvedValue(
      mockValidPalmResult as any
    );

    const response = await aiService.readPalm("data:image/jpeg;base64,xxxx", {
      school: ReadingSchool.EASTERN,
      topics: ["nguHanh", "thienVan", "love"],
      hand: HandOrientation.LEFT,
    });

    expect(groqProvider.readPalm).toHaveBeenCalledTimes(1);
    expect(geminiProvider.readPalm).toHaveBeenCalledTimes(1);
    expect(response.provider).toBe("gemini");
    expect(response.result.isPalm).toBe(true);
  });

  it("AiService correctly propagates error if both primary and fallback fail", async () => {
    vi.spyOn(groqProvider, "readPalm").mockRejectedValue(
      new Error("Groq unavailable")
    );
    vi.spyOn(geminiProvider, "readPalm").mockRejectedValue(
      new Error("Gemini unavailable")
    );

    await expect(
      aiService.readPalm("data:image/jpeg;base64,xxxx", {
        school: ReadingSchool.EASTERN,
        topics: ["nguHanh", "thienVan", "love"],
        hand: HandOrientation.LEFT,
      })
    ).rejects.toThrow("Gemini unavailable");
  });
});
