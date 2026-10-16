import { Link } from "react-router-dom";
import PageWrapper from "@/components/PageWrapper";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import useTransactionsQuery from "./hooks/useTransactionsQuery";
import TransactionList from "./components/TransactionList";

export const Wallet = () => {
  const { user } = useAuth();
  const { data, isLoading } = useTransactionsQuery();

  const transactions = data?.items || [];

  return (
    <PageWrapper>
      <div className="component:Wallet w-full max-w-[960px] mx-auto pt-8 md:pt-12 pb-24 px-4 font-mono text-ink">
        {/* Navigation breadcrumb */}
        <div className="mb-6">
          <Link
            to={BaseUrl.Account}
            className="text-xs text-mute hover:text-ink transition-colors inline-flex items-center gap-1"
          >
            &larr; Quay lại Tài khoản
          </Link>
        </div>

        {/* Page header */}
        <div className="pb-3 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Ví credits</h1>
            <p className="text-sm text-mute mt-1">
              Quản lý số dư và theo dõi lịch sử nạp/dùng credit.
            </p>
          </div>
          <Link
            to={BaseUrl.Referral}
            className="h-9 px-4 rounded-[4px] bg-ink text-canvas hover:bg-charcoal text-sm font-medium inline-flex items-center justify-center transition-colors select-none self-start sm:self-auto"
          >
            Mời bạn bè nhận thêm credits &rarr;
          </Link>
        </div>

        {/* Balance Display Card */}
        <div className="mt-8 p-6 bg-surface-card border border-hairline rounded-[4px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs text-mute uppercase font-bold tracking-wider">
              Số dư hiện tại
            </span>
            <div
              data-testid="wallet-balance-large"
              className="text-4xl sm:text-5xl font-bold text-ink mt-2 tracking-tight"
            >
              {user?.creditBalance ?? 0} credits
            </div>
            <p className="text-xs text-mute mt-2">
              Credits không hết hạn. Mỗi lần xem bói tiêu thụ 1 credit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {user?.referral?.canEnterCode && (
              <Link
                to={BaseUrl.ReferralEnter}
                className="h-9 px-4 rounded-[4px] bg-canvas text-ink border border-ink hover:bg-surface-soft text-xs font-medium inline-flex items-center justify-center transition-colors text-center"
              >
                Nhập mã giới thiệu (+1)
              </Link>
            )}
            <Link
              to={BaseUrl.Homepage}
              className="h-9 px-4 rounded-[4px] bg-ink text-canvas hover:bg-charcoal text-xs font-medium inline-flex items-center justify-center transition-colors text-center"
            >
              Xem bói ngay (−1)
            </Link>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mt-12">
          <div className="pb-3 border-b border-hairline mb-4">
            <h2 className="text-base font-bold text-ink">
              Lịch sử biến động credits
            </h2>
          </div>

          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
          />
        </div>
      </div>
    </PageWrapper>
  );
};

export default Wallet;
