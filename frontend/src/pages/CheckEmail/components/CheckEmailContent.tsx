import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import useResendVerification from "../hooks/useResendVerification";
import type { ApiErrorPayload } from "@/services/authService";

const COOLDOWN_SECONDS = 60;

const StepsSection = () => (
  <div className="flex flex-col">
    <div className="font-bold text-ink text-base pb-2">Làm theo 3 bước</div>
    <div className="h-[1px] w-full bg-hairline" />
    <div className="py-2.5 flex items-center text-base text-body">
      <span className="font-bold text-ink mr-2">[+]</span> Mở email từ PalmSight
    </div>
    <div className="h-[1px] w-full bg-hairline" />
    <div className="py-2.5 flex items-center text-base text-body">
      <span className="font-bold text-ink mr-2">[+]</span> Bấm vào link xác thực
    </div>
    <div className="h-[1px] w-full bg-hairline" />
    <div className="py-2.5 flex items-center text-base text-body">
      <span className="font-bold text-ink mr-2">[+]</span> Quay lại để đăng nhập
    </div>
    <div className="h-[1px] w-full bg-hairline" />
  </div>
);

export const CheckEmailContent = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resendMutation = useResendVerification();

  const rawEmail =
    (location.state as { email?: string })?.email ||
    searchParams.get("email") ||
    "";
  const email = rawEmail.trim();

  const [cooldown, setCooldown] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || resendMutation.isPending) return;

    if (!email) {
      setErrorMessage(
        "Không tìm thấy địa chỉ email để gửi lại xác minh. Vui lòng quay lại trang đăng ký."
      );
      return;
    }

    setErrorMessage(null);
    try {
      await resendMutation.mutateAsync({ email });
      setToastMessage("Đã gửi lại email xác minh thành công.");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      const response = err?.response;
      const apiError = (response?.data?.error || {}) as ApiErrorPayload;
      if (response?.status === 429) {
        setErrorMessage(
          apiError.message ||
            "Bạn đã gửi quá số lần cho phép. Vui lòng thử lại sau ít phút."
        );
      } else {
        setErrorMessage(
          apiError.message ||
            "Không thể gửi lại email vào lúc này. Vui lòng thử lại sau."
        );
      }
    }
  }, [cooldown, resendMutation, email]);

  const isResending = resendMutation.isPending;

  return (
    <div className="w-full max-w-[560px] flex flex-col">
      {toastMessage && (
        <div
          role="status"
          data-testid="toast-success"
          className="mb-6 p-3 bg-surface-card border border-terminal-success text-ink rounded text-sm flex items-start gap-2"
        >
          <span className="font-bold text-terminal-success">[✓]</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-3 bg-error-container/30 border border-terminal-danger text-ink rounded text-sm flex items-start gap-2"
        >
          <span className="font-bold text-terminal-danger">[!]</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <h1 className="text-[34px] md:text-[38px] font-bold text-ink tracking-normal leading-tight">
        Kiểm tra hộp thư của bạn
      </h1>

      <div className="h-4" />

      <div className="flex flex-col">
        <p className="text-base text-body">
          Đã gửi link xác minh tới{" "}
          <span className="font-bold text-ink" data-testid="user-email">
            {email || "hộp thư của bạn"}
          </span>
        </p>
        <div className="h-2" />
        <p className="text-sm text-mute">Link có hiệu lực trong 24 giờ.</p>
      </div>

      <div className="h-8" />
      <StepsSection />
      <div className="h-8" />

      <div className="flex flex-wrap items-center gap-4">
        <button
          id="resend-btn"
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className={`h-9 px-5 rounded font-medium text-base transition-colors duration-150 ${
            cooldown > 0 || isResending
              ? "bg-surface-card text-ash cursor-not-allowed select-none"
              : "bg-ink text-canvas hover:bg-charcoal cursor-pointer active:bg-ink-deep"
          }`}
        >
          {isResending
            ? "[...] Đang gửi..."
            : cooldown > 0
            ? `Gửi lại sau (${cooldown}s)...`
            : "Gửi lại email xác minh"}
        </button>

        <Link
          to={BaseUrl.Register}
          className="text-base text-ink underline underline-offset-4 hover:text-charcoal transition-colors"
        >
          Dùng email khác
        </Link>
      </div>

      <div className="h-8" />

      <div className="p-3 px-4 bg-transparent border border-hairline rounded">
        <p className="text-sm text-body">
          <span className="font-medium text-mute">[i]</span> Không thấy email?
          Kiểm tra thư mục spam.
        </p>
      </div>
    </div>
  );
};

export default CheckEmailContent;
