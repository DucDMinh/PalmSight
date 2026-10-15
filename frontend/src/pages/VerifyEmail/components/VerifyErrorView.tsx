import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useResendVerificationMutation } from "../hooks/useVerifyEmail";
import type { ApiErrorPayload } from "@/services/authService";

interface VerifyErrorViewProps {
  errorMessage: string | null;
}

export const VerifyErrorView = ({ errorMessage }: VerifyErrorViewProps) => {
  const [resendEmail, setResendEmail] = useState<string>("");
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const resendMutation = useResendVerificationMutation();

  const handleResendSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendError(null);
    setResendSuccess(false);

    try {
      await resendMutation.mutateAsync({ email: resendEmail.trim() });
      setResendSuccess(true);
    } catch (err: any) {
      const apiError = (err?.response?.data?.error || {}) as ApiErrorPayload;
      setResendError(
        apiError.message ||
          "Không thể gửi lại email vào lúc này. Vui lòng thử lại sau."
      );
    }
  };

  return (
    <div data-testid="verify-error" className="w-full flex flex-col items-start">
      <div className="p-4 bg-error-container/20 border border-terminal-danger rounded w-full mb-6">
        <div className="flex items-start gap-2 text-ink">
          <span className="font-bold text-terminal-danger text-lg">[!]</span>
          <div>
            <h2 className="text-base font-bold text-ink">
              {errorMessage ||
                "Liên kết xác minh không hợp lệ hoặc đã hết hạn (quá 24 giờ)."}
            </h2>
            <p className="text-sm text-mute mt-1">
              Liên kết này có thể đã được sử dụng hoặc đã quá hạn 24 giờ.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full p-5 border border-hairline rounded bg-surface-soft mb-6">
        <h3 className="text-base font-bold text-ink mb-1">
          Gửi lại link xác minh
        </h3>
        <p className="text-sm text-mute mb-4">
          Nhập email đăng ký của bạn để nhận liên kết xác thực mới.
        </p>

        {resendSuccess ? (
          <div className="p-3 bg-surface-card border border-terminal-success rounded text-sm text-ink flex items-center gap-2">
            <span className="font-bold text-terminal-success">[✓]</span>
            <span>Nếu email tồn tại, link xác minh mới đã được gửi.</span>
          </div>
        ) : (
          <form onSubmit={handleResendSubmit} className="flex flex-col gap-3">
            {resendError && (
              <p className="text-sm text-terminal-danger flex items-center gap-1">
                <span className="font-bold">[!]</span> {resendError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                aria-label="Email nhận lại link xác minh"
                placeholder="minhanh@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={resendMutation.isPending}
                className="flex-1 h-9 bg-canvas border border-hairline rounded px-3 text-base text-ink placeholder:text-ash outline-none focus:border-ink"
              />
              <button
                type="submit"
                disabled={resendMutation.isPending || !resendEmail.trim()}
                className="h-9 px-4 bg-ink text-canvas rounded font-medium text-base hover:bg-charcoal transition-colors disabled:opacity-50 cursor-pointer"
              >
                {resendMutation.isPending ? "[...] Đang gửi..." : "Gửi lại link xác minh"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div>
        <Link
          to={BaseUrl.Login}
          className="text-base text-ink underline underline-offset-4 hover:text-charcoal transition-colors"
        >
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default VerifyErrorView;
