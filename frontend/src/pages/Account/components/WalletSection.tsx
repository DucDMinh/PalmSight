import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import type { UserDto } from "../types";

interface WalletSectionProps {
  user: UserDto | null;
}

export const WalletSection = ({ user }: WalletSectionProps) => {
  return (
    <section id="vi-credits" className="mt-16 scroll-mt-20 font-mono text-ink">
      <div className="pb-2 border-b border-hairline">
        <h2 className="text-lg font-bold">Ví credits</h2>
      </div>

      <div className="mt-6 p-4 sm:p-6 bg-surface-card border border-hairline rounded-[4px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <span className="text-xs text-mute uppercase font-bold tracking-wider block">
            Số dư hiện tại
          </span>
          <div
            data-testid="account-credits-display"
            className="text-3xl sm:text-4xl font-bold text-ink mt-1"
          >
            {user?.creditBalance ?? 0} credits
          </div>
          <p className="text-xs text-mute mt-2">
            Credits không có hạn sử dụng. Mỗi lần xem bói tiêu thụ 1 credit.
          </p>
        </div>

        <Link
          to={BaseUrl.Wallet}
          className="h-9 px-4 rounded-[4px] bg-ink text-canvas hover:bg-charcoal text-sm font-medium inline-flex items-center justify-center transition-colors select-none shrink-0"
        >
          Ví credits &rarr;
        </Link>
      </div>

      <div className="mt-3">
        <Link
          to={BaseUrl.Wallet}
          className="text-xs font-medium text-ink underline underline-offset-4 hover:opacity-75 transition-opacity"
        >
          Xem chi tiết lịch sử giao dịch tại Ví credits &rarr;
        </Link>
      </div>
    </section>
  );
};

export default WalletSection;
