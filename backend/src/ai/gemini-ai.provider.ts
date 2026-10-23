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
export class GeminiAiProvider implements AiProvider {
  readonly name = "gemini";
  private readonly logger = new Logger(GeminiAiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async readPalm(
    imageBase64: string,
    options: AiReadingOptions,
    modelOverride?: string
  ): Promise<PalmResult> {
    const apiKey = this.config.get<string>("GEMINI_API_KEY");
    const configuredModel =
      (this.config.get<string>("AI_PROVIDER") || "gemini").toLowerCase() ===
      "gemini"
        ? this.config.get<string>("AI_MODEL") || "gemini-3.8-flash"
        : this.config.get<string>("AI_FALLBACK_MODEL") || "gemini-3.8-flash";
    const model = modelOverride || configuredModel;
    const timeoutMs = Number(this.config.get<string>("AI_TIMEOUT_MS") || 40000);
    const maxTokens = Number(this.config.get<string>("AI_MAX_TOKENS") || 4096);
    const temperature = Number(
      this.config.get<string>("AI_TEMPERATURE") || 0.7
    );
    const thinkingBudgetStr = this.config.get<string>("AI_THINKING_BUDGET");
    const thinkingBudget =
      thinkingBudgetStr !== undefined ? Number(thinkingBudgetStr) : 0;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(options.school);
    const userPrompt = buildUserPrompt(options);

    const rawBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let didTimeout = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);

    const generationConfig: Record<string, any> = {
      responseMimeType: "application/json",
      temperature,
      maxOutputTokens: maxTokens,
    };
    if (thinkingBudget >= 0) {
      generationConfig.thinkingConfig = { thinkingBudget };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [
                { text: userPrompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: rawBase64,
                  },
                },
              ],
            },
          ],
          generationConfig,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          parsedMessage = errorJson?.error?.message
            ? `${errorJson.error.message} (${errorText})`
            : errorText;
        } catch {
          parsedMessage = errorText;
        }
        throw new Error(
          `Gemini API error HTTP ${response.status}: ${parsedMessage}`
        );
      }

      const data = (await response.json()) as any;
      const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawContent) {
        const fullJson = JSON.stringify(data);
        throw new Error(`Gemini API returned empty text content: ${fullJson}`);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch (parseErr: any) {
        throw new Error(
          `Gemini JSON parse failed: ${parseErr.message}. Raw: ${rawContent.slice(0, 500)}`
        );
      }

      const sanitized = sanitizePalmResult(parsed, options);

      const validated = (await palmResultSchema.validate(sanitized, {
        abortEarly: false,
        stripUnknown: true,
      })) as PalmResult;

      return validated;
    } catch (err: any) {
      const isAbort =
        didTimeout ||
        err.name === "AbortError" ||
        controller.signal.aborted;
      const errorMsg = isAbort
        ? `Gemini request timed out after ${timeoutMs}ms or connection was aborted`
        : err.cause?.message
          ? `${err.message} (cause: ${err.cause.message})`
          : err.message;
      this.logger.warn(`Gemini reading failed: ${errorMsg}`);
      if (isAbort) {
        throw new Error(errorMsg);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
