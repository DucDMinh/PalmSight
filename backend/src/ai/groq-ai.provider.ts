import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PalmResult, palmResultSchema } from "@palmsight/shared";
import {
  AiProvider,
  AiReadingOptions,
  sanitizePalmResult,
} from "./ai-provider.interface";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";

@Injectable()
export class GroqAiProvider implements AiProvider {
  readonly name = "groq";
  private readonly logger = new Logger(GroqAiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async readPalm(
    imageBase64: string,
    options: AiReadingOptions,
    modelOverride?: string
  ): Promise<PalmResult> {
    const apiKey = this.config.get<string>("GROQ_API_KEY");
    const baseUrl =
      this.config.get<string>("AI_BASE_URL") ||
      "https://api.groq.com/openai/v1";
    const configuredModel =
      (this.config.get<string>("AI_PROVIDER") || "gemini").toLowerCase() ===
      "groq"
        ? this.config.get<string>("AI_MODEL") || "qwen/qwen3.8-27b"
        : this.config.get<string>("AI_FALLBACK_MODEL") || "qwen/qwen3.8-27b";
    const model = modelOverride || configuredModel;
    const timeoutMs = Number(this.config.get<string>("AI_TIMEOUT_MS") || 40000);
    const maxTokens = Number(this.config.get<string>("AI_MAX_TOKENS") || 2000);
    const temperature = Number(
      this.config.get<string>("AI_TEMPERATURE") || 0.7
    );

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(options.school);
    const userPrompt = buildUserPrompt(options);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
              ],
            },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error("Groq API returned empty message content");
      }

      const parsed = JSON.parse(rawContent);

      const sanitized = sanitizePalmResult(parsed, options);

      const validated = (await palmResultSchema.validate(sanitized, {
        abortEarly: false,
        stripUnknown: true,
      })) as PalmResult;

      return validated;
    } catch (err: any) {
      this.logger.warn(`Groq reading failed: ${err.message}`);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
