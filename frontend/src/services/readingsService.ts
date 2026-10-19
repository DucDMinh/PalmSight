import httpService from "./httpService";
import { READINGS_URL, READINGS_GUEST_URL } from "@/consts/apiUrl";
import type {
  CreateGuestReadingResponseDto,
  GuestReadingPreviewDto,
  CreateReadingResponseDto,
  ReadingDto,
  ReadingSchool,
  HandOrientation,
} from "@palmsight/shared";

export interface CreateReadingParams {
  school: ReadingSchool;
  hand: HandOrientation;
  topics?: string[];
  aiConsent: boolean;
  image: File | Blob;
  idempotencyKey: string;
}

export class ReadingsService {
  /**
   * Submit guest trial reading request (multipart/form-data with signed cookie and Idempotency-Key)
   */
  async createGuestReading(
    formData: FormData,
    idempotencyKey: string
  ): Promise<CreateGuestReadingResponseDto> {
    const response = await httpService.axios.post<CreateGuestReadingResponseDto>(
      READINGS_GUEST_URL,
      formData,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        withCredentials: true,
        timeout: 60000,
      }
    );
    return response.data;
  }

  /**
   * Retrieve 50% teaser preview for a guest reading by claimToken
   */
  async getGuestReadingPreview(token: string): Promise<GuestReadingPreviewDto> {
    const response = await httpService.axios.get<GuestReadingPreviewDto>(
      `${READINGS_GUEST_URL}/${token}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }

  /**
   * Authenticated member reading creation
   */
  async createReading(params: CreateReadingParams): Promise<CreateReadingResponseDto> {
    const formData = new FormData();
    formData.append("school", params.school);
    if (params.topics && params.topics.length > 0) {
      formData.append("topics", params.topics.join(","));
    }
    formData.append("hand", params.hand);
    formData.append("aiConsent", String(params.aiConsent));
    formData.append("image", params.image);

    const response = await httpService.axios.post<CreateReadingResponseDto>(
      READINGS_URL,
      formData,
      {
        headers: {
          "Idempotency-Key": params.idempotencyKey,
        },
        withCredentials: true,
        timeout: 60000,
      }
    );
    return response.data;
  }

  /**
   * Retrieve full reading by ID
   */
  async getReadingById(readingId: string): Promise<ReadingDto> {
    const response = await httpService.axios.get<ReadingDto>(
      `${READINGS_URL}/${readingId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
}

export const readingsService = new ReadingsService();
export default readingsService;
