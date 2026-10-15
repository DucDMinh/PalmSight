import {
  ReadingSchool,
  HandOrientation,
  ImageQuality,
  ReadingStatus,
} from '../enums';
import { PaginatedResponseDto } from './common.dto';

export interface ReadingSectionResult {
  key: string;
  title: string;
  observation: string;
  meaning: string;
}

export type ReadingAspectsMap = Record<string, string>;

export interface PalmResult {
  isPalm: boolean;
  rejectReason?: string | null;
  school?: ReadingSchool | null;
  hand?: HandOrientation | null;
  imageQuality?: ImageQuality | null;
  topics?: string[] | null;
  sections?: ReadingSectionResult[] | null;
  aspects?: ReadingAspectsMap | null;
  summary?: string | null;
  advice?: string | null;
  disclaimer?: string | null;
}

export interface CreateReadingRequestDto {
  school: ReadingSchool;
  topics?: string;
  hand: HandOrientation;
  aiConsent: boolean | string;
}

export interface ReadingDto {
  id: string;
  status: ReadingStatus;
  school: ReadingSchool;
  topics: string[];
  hand: HandOrientation;
  result: PalmResult | null;
  rejectReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ReadingListItemDto {
  id: string;
  status: ReadingStatus;
  school: ReadingSchool;
  topics: string[];
  hand: HandOrientation;
  summary: string | null;
  createdAt: string;
}

export interface CreateReadingResponseDto {
  reading: ReadingDto;
  creditBalance: number;
}

export type ReadingListResponseDto = PaginatedResponseDto<ReadingListItemDto>;
