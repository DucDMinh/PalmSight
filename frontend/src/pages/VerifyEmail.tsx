import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";
import BaseUrl from "@/consts/baseUrl";
import authService, { ApiErrorPayload } from "@/services/authService";
import { useAuth } from "@/providers/AuthenticationProvider";
import type { AuthResponseDto } from "@palmsight/shared";

type VerifyState = "idle" | "loading" | "success" | "error";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthSession } = useAuth();

  const [status, setStatus] = useState<VerifyState>("idle");
  const [authData, setAuthData] = useState<AuthResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3-second auto-redirect countdown
  const [countdown, setCountdown] = useState<number>(3);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inline resend form in error state
  const [resendEmail, setResendEmail] = useState<string>("");
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<boolean>(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Determine destination
  const getDestination = (data: AuthResponseDto | null): string => {
    if (!data) return BaseUrl.Homepage;
    // If user received 4 credits (referral bonus) or linked OAuth or 0 credits, skip referral enter -> go to /scan
    if (
      data.user.creditBalance === 4 ||
      data.isNewUser === false ||
      data.user.creditBalance === 0
    ) {
      return BaseUrl.Scan;
    }
    // Standard registration with 3 credits -> /referral/enter
    return BaseUrl.ReferralEnter;
  };

  const handleNavigateNow = () => {
    if (redirectTimerRef.current) {
      clearInterval(redirectTimerRef.current);
    }
    navigate(getDestination(authData));
  };

  // On mount: read token and strip from URL bar
  useEffect(() => {
    const rawToken = searchParams.get("token");

    // Clean token from browser URL per TC-030 security requirement
    if (rawToken && typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname || "/verify-email");
    }

    if (!rawToken) {
      setStatus("error");
      setErrorMessage("Liên kết xác minh không hợp lệ hoặc đã hết hạn (quá 24 giờ).");
      return;
    }

    setStatus("loading");
    let isCancelled = false;

    authService
      .postVerifyEmail({ token: rawToken })
      .then((data) => {
        if (isCancelled) return;
        setAuthData(data);
        setStatus("success");
        // Store in-memory accessToken and user in AuthProvider
        setAuthSession({
          accessToken: data.accessToken,
          user: data.user,
        });
      })
      .catch((err: any) => {
        if (isCancelled) return;
        setStatus("error");
        const apiError = (err?.response?.data?.error || {}) as ApiErrorPayload;
        setErrorMessage(
          apiError.message ||
            "Liên kết xác minh không hợp lệ hoặc đã hết hạn (quá 24 giờ)."
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [searchParams, setAuthSession]);

  // Handle 3-second countdown when success
  useEffect(() => {
    if (status !== "success" || !authData) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(getDestination(authData));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    redirectTimerRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, [status, authData, navigate]);

  // Inline resend form submission
  const handleResendSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await authService.postResendVerification({ email: resendEmail.trim() });
      setResendSuccess(true);
    } catch (err: any) {
      const apiError = (err?.response?.data?.error || {}) as ApiErrorPayload;
      setResendError(
        apiError.message || "Không thể gửi lại email vào lúc này. Vui lòng thử lại sau."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-mono flex flex-col selection:bg-surface-card">
      <AuthHeader rightAction={status === "success" ? "user" : "login"} />

      <main className="flex-1 w-full max-w-[960px] mx-auto px-4 pt-16 md:pt-24 pb-24">
        <div className="w-full max-w-[560px] flex flex-col items-start text-left">
          {/* 1. Loading State */}
          {status === "loading" && (
            <div data-testid="verify-loading" className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-2 text-ink text-lg font-bold">
                <span className="animate-spin">[~]</span>
                <span>Đang xác thực email và kích hoạt tài khoản...</span>
              </div>
              <p className="text-sm text-mute">Vui lòng chờ trong giây lát.</p>
            </div>
          )}

          {/* 2. Success State (matches Stitch Screen 1d106024adaa426eadcacab751819351) */}
          {status === "success" && authData && (
            <div data-testid="verify-success" className="flex flex-col items-start w-full">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[34px] md:text-[38px] font-bold text-ink select-none">
                  [+]
                </span>
                <h1 className="text-[34px] md:text-[38px] font-bold text-ink tracking-normal leading-tight">
                  Email đã được xác thực
                </h1>
              </div>

              {/* Congratulatory subtitle */}
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

              {/* Countdown announcement */}
              <div className="text-sm text-mute mb-8 flex items-center gap-2">
                <span>[i]</span>
                <span>
                  Tự động chuyển tiếp sau{" "}
                  <span className="font-bold text-ink font-mono">{countdown}s</span>...
                </span>
              </div>

              {/* CTA Action button */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleNavigateNow}
                  className="bg-ink text-canvas font-medium text-base h-9 px-5 rounded inline-flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-charcoal active:bg-ink-deep"
                >
                  Bỏ qua chờ đợi
                </button>
              </div>
            </div>
          )}

          {/* 3. Error State (TC-016, TC-033, invalid or expired token) */}
          {status === "error" && (
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

              {/* Resend Inline Form */}
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
                        disabled={isResending}
                        className="flex-1 h-9 bg-canvas border border-hairline rounded px-3 text-base text-ink placeholder:text-ash outline-none focus:border-ink"
                      />
                      <button
                        type="submit"
                        disabled={isResending || !resendEmail.trim()}
                        className="h-9 px-4 bg-ink text-canvas rounded font-medium text-base hover:bg-charcoal transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isResending ? "[...] Đang gửi..." : "Gửi lại link xác minh"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Link back to login */}
              <div>
                <Link
                  to={BaseUrl.Login}
                  className="text-base text-ink underline underline-offset-4 hover:text-charcoal transition-colors"
                >
                  Quay lại Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthFooter />
    </div>
  );
};

export default VerifyEmailPage;
