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
    <div data-testid="verify-success" className="flex flex-col items-start w-full">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[34px] md:text-[38px] font-bold text-ink select-none">
          [+]
        </span>
        <h1 className="text-[34px] md:text-[38px] font-bold text-ink tracking-normal leading-tight">
          Email đã được xác thực
        </h1>
      </div>

      <div className="text-base text-body mb-6">
        {authData.user.creditBalance === 4 ? (
          <p>
            Chúc mừng! Bạn đã nhận{" "}
            <span className="font-bold text-ink">4 credits</span> miễn phí (3
            khởi tạo + 1 giới thiệu).
          </p>
        ) : !authData.isNewUser ? (
          <p>Tài khoản của bạn đã được gắn mật khẩu thành công.</p>
        ) : authData.user.creditBalance === 0 ? (
          <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
        ) : (
          <p>
            Tài khoản của bạn đã sẵn sàng. Bạn đã nhận{" "}
            <span className="font-bold text-ink">3 credits</span>.
          </p>
        )}
      </div>

      <div className="text-sm text-mute mb-8 flex items-center gap-2">
        <span>[i]</span>
        <span>
          Tự động chuyển tiếp sau{" "}
          <span className="font-bold text-ink font-mono">{countdown}s</span>...
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onNavigateNow}
          className="bg-ink text-canvas font-medium text-base h-9 px-5 rounded inline-flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-charcoal active:bg-ink-deep"
        >
          Bỏ qua chờ đợi
        </button>
      </div>
    </div>
  );
};

export default VerifySuccessView;
