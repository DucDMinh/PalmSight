import { ReadingSchool, HandOrientation, PalmResult } from "@palmsight/shared";

export interface AiReadingOptions {
  school: ReadingSchool;
  topics: string[];
  hand: HandOrientation;
}

export interface AiProvider {
  readonly name: string;
  readPalm(imageBase64: string, options: AiReadingOptions): Promise<PalmResult>;
}

export {
  sanitizePalmResult,
  parseAiJsonResponse,
} from "./sanitize-palm-result";
