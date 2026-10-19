import { TarotCorners } from "@/components/mystic/MysticDivider";
import type { AuthResponseDto } from "../types";

interface VerifySuccessViewProps {
  authData: AuthResponseDto;
  countdown: number;
  onNavigateNow: () => void;
}

export const VerifySuccessView = ({
  authData,
  countdown,
  onNavigateNow,
}: VerifySuccessViewProps) => {
  return (
    <div
      data-testid="verify-success"
      className="flex flex-col items-start w-full mystic-card rounded-2xl p-6 sm:p-10 relative overflow-hidden"
    >
      <TarotCorners />
      <div className="flex items-baseline gap-2.5 mb-4 relative z-10">
        <span className="text-2xl md:text-3xl font-mono font-bold text-terminal-success select-none">
          [+]
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-gold-gradient tracking-normal leading-tight">
          Email đã được xác thực
        </h1>
      </div>

      <div className="text-base text-body mb-6 relative z-10">
        {authData.user.creditBalance === 4 ? (
          <p>
            Chúc mừng! Bạn đã nhận{" "}
            <span className="font-bold text-gold-light">4 credits</span> miễn phí (3
            khởi tạo + 1 giới thiệu).
          </p>
        ) : !authData.isNewUser ? (
          <p>Tài khoản của bạn đã được gắn mật khẩu thành công.</p>
        ) : authData.user.creditBalance === 0 ? (
          <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
        ) : (
          <p>
            Tài khoản của bạn đã sẵn sàng. Bạn đã nhận{" "}
            <span className="font-bold text-gold-light">3 credits</span>.
          </p>
        )}
      </div>

      <div className="text-sm text-mute mb-8 flex items-center gap-2 relative z-10">
        <span className="text-gold font-mono">[i]</span>
        <span>
          Tự động chuyển tiếp sau{" "}
          <span className="font-bold text-gold-light font-mono">{countdown}s</span>...
        </span>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <button
          type="button"
          onClick={onNavigateNow}
          className="btn-primary h-10 px-6 text-sm inline-flex items-center justify-center cursor-pointer"
        >
          Bỏ qua chờ đợi
        </button>
      </div>
    </div>
  );
};

export default VerifySuccessView;
