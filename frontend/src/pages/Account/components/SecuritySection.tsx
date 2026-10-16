import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import type { UserDto } from "../types";

interface SecuritySectionProps {
  user: UserDto | null;
}

export const SecuritySection = ({ user }: SecuritySectionProps) => {
  const hasPassword = Boolean(user?.hasPassword);

  return (
    <section id="bao-mat" className="mt-16 scroll-mt-20 font-mono text-ink">
      <div className="pb-2 border-b border-hairline">
        <h2 className="text-lg font-bold">Bảo mật</h2>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {hasPassword ? (
          <div className="p-4 bg-surface-soft border border-hairline rounded-[4px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Mật khẩu tài khoản</h3>
              <p className="mt-1 text-xs text-mute leading-relaxed">
                Đổi mật khẩu định kỳ giúp bảo vệ tài khoản của bạn an toàn hơn.
              </p>
            </div>
            <Link
              to={BaseUrl.ChangePassword}
              className="h-9 px-4 rounded-[4px] bg-ink text-canvas hover:bg-charcoal text-xs font-medium inline-flex items-center justify-center shrink-0 transition-colors select-none"
            >
              Đổi mật khẩu
            </Link>
          </div>
        ) : (
          <div className="p-4 bg-surface-card border border-hairline rounded-[4px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Thiết lập mật khẩu</h3>
              <p className="mt-1 text-xs text-mute leading-relaxed">
                Tài khoản của bạn đăng nhập qua bên thứ ba (Google/Facebook). Bạn
                có thể đặt mật khẩu để đăng nhập bằng email hoặc username.
              </p>
            </div>
            <Link
              to={BaseUrl.ForgotPassword}
              className="h-9 px-4 rounded-[4px] bg-ink text-canvas hover:bg-charcoal text-xs font-medium inline-flex items-center justify-center shrink-0 transition-colors select-none"
            >
              Đặt mật khẩu
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default SecuritySection;
