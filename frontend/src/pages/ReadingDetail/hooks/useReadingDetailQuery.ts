import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import readingDetailService from "../services";
import type { ReadingDto } from "@palmsight/shared";

export const READING_DETAIL_QUERY_KEY = ["reading-detail"];

export const useReadingDetailQuery = (id: string | undefined) => {
  return useQuery<ReadingDto>({
    queryKey: [...READING_DETAIL_QUERY_KEY, id],
    queryFn: () => {
      if (!id) throw new Error("Reading ID is required");
      return readingDetailService.getReading(id);
    },
    enabled: Boolean(id),
  });
};

export const useDeleteReadingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, any, string>({
    mutationFn: (id: string) => readingDetailService.deleteReading(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readings"] });
    },
  });
};

export default useReadingDetailQuery;
