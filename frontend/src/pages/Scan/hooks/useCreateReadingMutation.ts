import { useMutation } from "@tanstack/react-query";
import scanService, { CreateReadingParams } from "../services";
import type { CreateReadingResponseDto } from "@palmsight/shared";

export const useCreateReadingMutation = () => {
  return useMutation<CreateReadingResponseDto, any, CreateReadingParams>({
    mutationFn: (params: CreateReadingParams) => scanService.createReading(params),
  });
};

export default useCreateReadingMutation;
