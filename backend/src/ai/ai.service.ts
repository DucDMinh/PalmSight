import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PalmResult } from "@palmsight/shared";
import {
  AiProvider,
  AiReadingOptions,
  sanitizePalmResult,
} from "./ai-provider.interface";
import { GroqAiProvider } from "./groq-ai.provider";
import { GeminiAiProvider } from "./gemini-ai.provider";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providers: Record<string, AiProvider>;

  constructor(
    private readonly config: ConfigService,
    private readonly groqProvider: GroqAiProvider,
    private readonly geminiProvider: GeminiAiProvider
  ) {
    this.providers = {
      groq: this.groqProvider,
      gemini: this.geminiProvider,
    };
  }

  async readPalm(
    imageBase64: string,
    options: AiReadingOptions
  ): Promise<{ result: PalmResult; provider: string; model: string }> {
    const primaryName = (
      this.config.get<string>("AI_PROVIDER") || "groq"
    ).toLowerCase();
    const fallbackName = (
      this.config.get<string>("AI_FALLBACK_PROVIDER") || "gemini"
    ).toLowerCase();

    const primaryProvider = this.providers[primaryName] || this.groqProvider;
    const fallbackProvider =
      this.providers[fallbackName] || this.geminiProvider;

    const primaryModel =
      primaryName === "groq"
        ? this.config.get<string>("AI_MODEL") || "qwen/qwen3.8-27b"
        : this.config.get<string>("AI_FALLBACK_MODEL") || "gemini-2.5-flash";

    const fallbackModel =
      fallbackName === "gemini"
        ? this.config.get<string>("AI_FALLBACK_MODEL") || "gemini-2.5-flash"
        : this.config.get<string>("AI_MODEL") || "qwen/qwen3.8-27b";

    try {
      this.logger.log(
        `Calling primary AI provider: ${primaryProvider.name} (${primaryModel})`
      );
      const rawResult = await primaryProvider.readPalm(imageBase64, options);
      const result = sanitizePalmResult(rawResult, options);
      return { result, provider: primaryProvider.name, model: primaryModel };
    } catch (primaryErr: any) {
      this.logger.warn(
        `Primary AI provider ${primaryProvider.name} failed: ${primaryErr.message}. Attempting fallback to ${fallbackProvider.name}...`
      );

      if (fallbackProvider && fallbackProvider !== primaryProvider) {
        try {
          const rawResult = await fallbackProvider.readPalm(imageBase64, options);
          const result = sanitizePalmResult(rawResult, options);
          return {
            result,
            provider: fallbackProvider.name,
            model: fallbackModel,
          };
        } catch (fallbackErr: any) {
          this.logger.error(
            `Fallback AI provider ${fallbackProvider.name} also failed: ${fallbackErr.message}`
          );
          throw fallbackErr;
        }
      }

      throw primaryErr;
    }
  }
}
