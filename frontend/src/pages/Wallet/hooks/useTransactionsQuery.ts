import { useQuery } from "@tanstack/react-query";
import walletService from "../services";
import type { CreditTransactionListResponseDto } from "@palmsight/shared";

export const TRANSACTIONS_QUERY_KEY = ["credit-transactions"];

export const useTransactionsQuery = (cursor?: string | null) => {
  return useQuery<CreditTransactionListResponseDto>({
    queryKey: [...TRANSACTIONS_QUERY_KEY, cursor || "initial"],
    queryFn: () => walletService.getTransactions(cursor),
  });
};

export default useTransactionsQuery;
