import { useState } from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import type { UserDto } from "../types";

interface ProfileSectionProps {
  user: UserDto | null;
}

export const ProfileSection = ({ user }: ProfileSectionProps) => {
  const { logout } = useAuth();
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => {
      setCopiedId(false);
    }, 2000);
  };

  const loginProvidersText = () => {
    const list: string[] = [];
    if (user?.hasPassword) list.push("Mật khẩu");
    if (user?.providers?.includes("GOOGLE" as any)) list.push("Google");
    if (user?.providers?.includes("FACEBOOK" as any)) list.push("Facebook");
    return list.length > 0 ? list.join(" · ") : "Mật khẩu";
  };

  const initialLetter = (user?.displayName || user?.username || "P")
    .charAt(0)
    .toUpperCase();

  const handleScrollToEnter = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.replaceState(null, "", "#nhap-ma");
    const el = document.getElementById("nhap-ma");
    if (el) {
      el.scrollIntoView?.({ behavior: "smooth" });
    }
  };

  return (
    <section id="ho-so" className="scroll-mt-20 font-mono text-ink">
      <div className="pb-2 border-b border-hairline">
        <h2 className="text-lg font-bold">Hồ sơ</h2>
      </div>

      {/* Profile summary row */}
      <div className="mt-6 flex items-start gap-4">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-12 h-12 rounded-full border border-hairline object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-surface-card border border-hairline flex items-center justify-center text-lg font-bold shrink-0 select-none">
            {initialLetter}
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-base font-bold text-ink">
            {user?.displayName || "Người dùng"}
          </span>
          <span className="text-sm text-mute">
            {user?.username ? `@${user.username}` : "Chưa có username"}
          </span>
          <div className="text-sm">
            <span className="text-mute">{user?.email || "Không có email"}</span>
            {user?.email && (
              <span className="text-ink font-medium ml-2">[+] Đã xác thực</span>
            )}
          </div>
          <span className="text-sm text-mute">
            Đăng nhập bằng: {loginProvidersText()}
          </span>
        </div>
      </div>

      {/* Account ID with copy button */}
      <div className="mt-6 p-3 bg-surface-card border border-hairline rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs text-mute uppercase font-bold tracking-wider">
            ID tài khoản
          </span>
          <span
            data-testid="account-id-display"
            className="text-xs sm:text-sm font-mono text-ink break-all select-all mt-0.5"
          >
            {user?.id || "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyId}
          disabled={!user?.id}
          className="h-8 px-3 rounded-[4px] bg-canvas text-ink border border-hairline hover:bg-surface-soft text-xs font-medium cursor-pointer self-start sm:self-auto transition-colors"
        >
          {copiedId ? "Đã chép!" : "Sao chép"}
        </button>
      </div>

      {/* Quick Navigation list */}
      <div className="mt-8 flex flex-col border-t border-hairline">
        {user?.referral?.canEnterCode && (
          <a
            href="#nhap-ma"
            onClick={handleScrollToEnter}
            className="py-3 border-b border-hairline flex justify-between items-center hover:bg-surface-soft px-1 transition-colors text-sm cursor-pointer"
          >
            <span className="text-ink">Nhập mã giới thiệu</span>
            <span className="text-mute">&gt;</span>
          </a>
        )}
        <Link
          to={BaseUrl.Privacy}
          className="py-3 border-b border-hairline flex justify-between items-center hover:bg-surface-soft px-1 transition-colors text-sm"
        >
          <span className="text-ink">Chính sách riêng tư</span>
          <span className="text-mute">&gt;</span>
        </Link>
        <Link
          to={BaseUrl.Terms}
          className="py-3 border-b border-hairline flex justify-between items-center hover:bg-surface-soft px-1 transition-colors text-sm"
        >
          <span className="text-ink">Điều khoản dịch vụ</span>
          <span className="text-mute">&gt;</span>
        </Link>
        <Link
          to={BaseUrl.DataDeletion}
          className="py-3 border-b border-hairline flex justify-between items-center hover:bg-surface-soft px-1 transition-colors text-sm"
        >
          <span className="text-ink">Hướng dẫn xoá dữ liệu</span>
          <span className="text-mute">&gt;</span>
        </Link>
      </div>

      {/* Data deletion info (ADR-0009: No in-app self-delete button!) */}
      <div className="mt-8 p-4 bg-canvas border border-hairline rounded-[4px]">
        <h3 className="text-sm font-bold text-ink">Yêu cầu xoá dữ liệu</h3>
        <p className="mt-1 text-xs text-mute leading-relaxed">
          Theo chính sách bảo mật, để xoá ảnh lòng bàn tay, kết quả bói và thông
          tin đăng nhập, vui lòng gửi email tới bộ phận hỗ trợ kèm ID tài khoản
          của bạn. Yêu cầu sẽ được xử lý trong vòng 30 ngày.
        </p>
        <div className="mt-3">
          <Link
            to={BaseUrl.DataDeletion}
            className="text-xs font-medium text-ink underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Xem hướng dẫn yêu cầu xoá dữ liệu &rarr;
          </Link>
        </div>
      </div>

      {/* Logout button */}
      <div className="mt-8 pt-4 border-t border-hairline flex items-center justify-between">
        <button
          type="button"
          onClick={logout}
          className="h-9 px-5 rounded-[4px] bg-canvas text-ink border border-hairline-strong hover:bg-surface-soft text-sm font-medium cursor-pointer transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </section>
  );
};

export default ProfileSection;
