import { Link } from "react-router-dom";
import PageWrapper from "@/components/PageWrapper";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import useReferralsQuery from "./hooks/useReferralsQuery";
import ReferralShareCard from "./components/ReferralShareCard";
import ReferralTable from "./components/ReferralTable";

export const Referral = () => {
  const { user } = useAuth();
  const { data, isLoading } = useReferralsQuery();

  return (
    <PageWrapper>
      <div className="component:Referral w-full max-w-[960px] mx-auto pt-8 md:pt-12 pb-24 px-4 font-mono text-ink">
        {/* Navigation breadcrumb */}
        <div className="mb-6">
          <Link
            to={BaseUrl.Account}
            className="text-xs text-mute hover:text-ink transition-colors inline-flex items-center gap-1"
          >
            &larr; Quay lại Tài khoản
          </Link>
        </div>

        {/* Page Header */}
        <div className="pb-3 border-b border-hairline mb-8">
          <h1 className="text-2xl font-bold text-ink">Giới thiệu bạn bè</h1>
          <p className="text-sm text-mute mt-1">
            Chia sẻ mã giới thiệu của bạn để nhận thêm credits xem bói miễn phí.
          </p>
        </div>

        {/* Share Card & rules */}
        <ReferralShareCard referralCode={user?.referralCode || ""} />

        {/* Invited users table */}
        <ReferralTable
          items={data?.items || []}
          totalRewarded={data?.totalRewarded ?? 0}
          totalCreditsEarned={data?.totalCreditsEarned ?? 0}
          isLoading={isLoading}
        />
      </div>
    </PageWrapper>
  );
};

export default Referral;
