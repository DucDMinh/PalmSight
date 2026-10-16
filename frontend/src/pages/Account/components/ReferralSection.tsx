import { useState } from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { showSuccess } from "@/helpers/toast";
import type { UserDto } from "../types";

interface ReferralSectionProps {
  user: UserDto | null;
}

export const ReferralSection = ({ user }: ReferralSectionProps) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const referralCode = user?.referralCode || "";
  const domain =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://palmsight.app";
  const shareLink = user?.referralLink || `${domain}/r/${referralCode}`;
  const sampleMessage = referralCode
    ? `Nhập mã ${referralCode} trên PalmSight: bạn được thêm 1 credit xem bói miễn phí`
    : "";

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showSuccess("Đã sao chép mã giới thiệu!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    showSuccess("Đã sao chép liên kết giới thiệu!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    if (!sampleMessage) return;
    navigator.clipboard.writeText(sampleMessage);
    setCopiedMessage(true);
    showSuccess("Đã sao chép câu mời mẫu!");
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <section id="gioi-thieu" className="mt-16 pb-12 scroll-mt-20 font-mono text-ink">
      <div className="pb-2 border-b border-hairline">
        <h2 className="text-lg font-bold">Giới thiệu</h2>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {/* Referral code card */}
        <div>
          <h3 className="text-xs text-mute uppercase font-bold tracking-wider mb-2">
            Mã độc bản của tôi
          </h3>
          <div className="max-w-[500px] bg-surface-card rounded-[4px] p-4 flex justify-between items-center border border-hairline">
            <span
              data-testid="referral-code-display"
              className="text-2xl sm:text-3xl font-bold text-ink tracking-widest font-mono select-all"
            >
              {referralCode || "—"}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!referralCode}
              className="h-8 px-3 rounded-[4px] bg-canvas text-ink border border-hairline hover:bg-surface-soft text-xs font-medium cursor-pointer transition-colors"
            >
              {copiedCode ? "Đã chép!" : "Sao chép mã"}
            </button>
          </div>
        </div>

        {/* Share link */}
        <div className="max-w-[500px]">
          <h3 className="text-xs text-mute uppercase font-bold tracking-wider mb-2">
            Liên kết giới thiệu
          </h3>
          <div
            data-testid="referral-link-display"
            className="bg-surface-card rounded-[4px] px-3.5 py-2.5 text-xs sm:text-sm text-ink border border-hairline select-all break-all"
          >
            {shareLink}
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!shareLink}
              className="h-9 px-4 rounded-[4px] bg-canvas text-ink border border-hairline-strong text-xs font-medium hover:bg-surface-soft transition-colors inline-flex items-center justify-center cursor-pointer select-none"
            >
              {copiedLink ? "Đã chép liên kết!" : "Sao chép liên kết"}
            </button>
          </div>
        </div>

        {/* Sample message */}
        <div className="max-w-[500px] p-4 bg-surface-soft border border-hairline rounded-[4px]">
          <span className="text-xs text-mute uppercase font-bold tracking-wider block mb-2">
            Câu chia sẻ mẫu
          </span>
          <p
            data-testid="sample-share-text"
            className="text-xs sm:text-sm text-ink leading-relaxed italic bg-canvas p-2.5 border border-hairline rounded-[4px]"
          >
            &ldquo;{sampleMessage}&rdquo;
          </p>
          <button
            type="button"
            onClick={handleCopyMessage}
            disabled={!sampleMessage}
            className="mt-3 text-xs font-medium text-ink underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer"
          >
            {copiedMessage ? "Đã chép câu mời!" : "Sao chép câu mời"}
          </button>
        </div>

        {/* Link to /referral */}
        <div className="pt-2 border-t border-hairline">
          <Link
            to={BaseUrl.Referral}
            className="text-xs sm:text-sm font-medium text-ink underline underline-offset-4 hover:opacity-75 transition-opacity inline-flex items-center gap-1"
          >
            Mời bạn bè nhận credit (Xem chi tiết danh sách người đã mời) &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReferralSection;
