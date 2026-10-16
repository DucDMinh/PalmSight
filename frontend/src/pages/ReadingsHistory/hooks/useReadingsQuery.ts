import { useQuery } from "@tanstack/react-query";
import readingsHistoryService from "../services";
import type { ReadingListResponseDto } from "@palmsight/shared";

export const READINGS_QUERY_KEY = ["readings"];

export const useReadingsQuery = (cursor?: string | null) => {
  return useQuery<ReadingListResponseDto>({
    queryKey: [...READINGS_QUERY_KEY, cursor || "initial"],
    queryFn: () => readingsHistoryService.getReadings(cursor),
  });
};

export default useReadingsQuery;
