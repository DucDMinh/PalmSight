import { useQuery } from "@tanstack/react-query";
import referralService from "../services";
import type { ReferralListResponseDto } from "@palmsight/shared";

export const REFERRALS_QUERY_KEY = ["me-referrals"];

export const useReferralsQuery = (cursor?: string | null) => {
  return useQuery<ReferralListResponseDto>({
    queryKey: [...REFERRALS_QUERY_KEY, cursor || "initial"],
    queryFn: () => referralService.getReferrals(cursor),
  });
};

export default useReferralsQuery;
