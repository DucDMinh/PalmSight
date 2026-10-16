import { useState } from "react";
import { showSuccess } from "@/helpers/toast";

interface ReferralShareCardProps {
  referralCode: string;
}

export const ReferralShareCard = ({ referralCode }: ReferralShareCardProps) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const domain =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://palmsight.app";
  const shareLink = `${domain}/r/${referralCode}`;
  const sampleMessage = `Nhập mã ${referralCode} trên PalmSight: bạn được thêm 1 credit xem bói miễn phí`;

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showSuccess("Đã sao chép mã giới thiệu!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    showSuccess("Đã sao chép liên kết giới thiệu!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(sampleMessage);
    setCopiedMessage(true);
    showSuccess("Đã sao chép câu mời mẫu!");
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "PalmSight - Bói chỉ tay AI",
          text: sampleMessage,
          url: shareLink,
        });
        return;
      } catch {
        // User cancelled or not supported, fallback to copy link
      }
    }
    handleCopyLink();
  };

  return (
    <div className="w-full flex flex-col font-mono text-ink">
      <h2 className="text-base font-bold text-ink mb-3">Mã của tôi</h2>

      {/* Code card */}
      <div className="max-w-[500px] bg-surface-card rounded-[4px] p-4 flex justify-between items-center border border-hairline">
        <span
          data-testid="referral-code-display"
          className="text-2xl sm:text-3xl font-bold text-ink tracking-widest font-mono"
        >
          {referralCode || "—"}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="text-sm font-medium text-ink underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer"
        >
          {copiedCode ? "Đã chép!" : "Sao chép mã"}
        </button>
      </div>

      {/* Share link snippet */}
      <div className="mt-4 max-w-[500px]">
        <div
          data-testid="referral-link-display"
          className="bg-surface-card rounded-[4px] px-3.5 py-2.5 text-xs sm:text-sm text-ink border border-hairline select-all break-all"
        >
          {shareLink}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleNativeShare}
            className="h-9 px-5 rounded-[4px] bg-ink text-canvas text-xs sm:text-sm font-medium hover:bg-charcoal transition-colors inline-flex items-center justify-center cursor-pointer select-none"
          >
            Chia sẻ
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-9 px-5 rounded-[4px] bg-canvas text-ink border border-hairline-strong text-xs sm:text-sm font-medium hover:bg-surface-soft transition-colors inline-flex items-center justify-center cursor-pointer select-none"
          >
            {copiedLink ? "Đã chép liên kết!" : "Sao chép liên kết"}
          </button>
        </div>
      </div>

      {/* Sample share text */}
      <div className="mt-6 max-w-[500px] p-4 bg-surface-soft border border-hairline rounded-[4px]">
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
          className="mt-3 text-xs font-medium text-ink underline underline-offset-4 hover:opacity-75 transition-opacity cursor-pointer"
        >
          {copiedMessage ? "Đã chép câu mời!" : "Sao chép câu mời"}
        </button>
      </div>

      {/* Cách nhận credits */}
      <div className="mt-8 max-w-[500px]">
        <h3 className="text-sm font-bold text-ink mb-2">Cách nhận credits</h3>
        <div className="flex flex-col gap-2 text-xs sm:text-sm text-body">
          <div>[+] Mỗi người đăng ký bằng mã của bạn, bạn nhận +2 credits</div>
          <div>[+] Tối đa 10 lượt thưởng mỗi ngày</div>
          <div>[+] Người được bạn mời nhận +1 credit khi nhập mã của bạn</div>
        </div>
      </div>
    </div>
  );
};

export default ReferralShareCard;
