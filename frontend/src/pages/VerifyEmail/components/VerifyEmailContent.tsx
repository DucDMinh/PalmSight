import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import useVerifyEmail from "../hooks/useVerifyEmail";
import VerifyLoadingView from "./VerifyLoadingView";
import VerifySuccessView from "./VerifySuccessView";
import VerifyErrorView from "./VerifyErrorView";
import type { AuthResponseDto, VerifyState } from "../types";
import type { ApiErrorPayload } from "@/services/authService";

const getDestination = (data: AuthResponseDto | null): string => {
  if (!data) return BaseUrl.Homepage;
  if (
    data.user.creditBalance === 4 ||
    data.isNewUser === false ||
    data.user.creditBalance === 0
  ) {
    return BaseUrl.Scan;
  }
  return BaseUrl.ReferralEnter;
};

export const VerifyEmailContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthSession } = useAuth();
  const { mutateAsync: verifyEmailAsync } = useVerifyEmail();

  const [status, setStatus] = useState<VerifyState>("idle");
  const [authData, setAuthData] = useState<AuthResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNavigateNow = useCallback(() => {
    if (redirectTimerRef.current) {
      clearInterval(redirectTimerRef.current);
    }
    navigate(getDestination(authData));
  }, [authData, navigate]);

  useEffect(() => {
    const rawToken = searchParams.get("token");
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

    verifyEmailAsync({ token: rawToken })
      .then((data) => {
        if (isCancelled) return;
        setAuthData(data);
        setStatus("success");
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
  }, [searchParams, setAuthSession, verifyEmailAsync]);

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
    return () => clearInterval(interval);
  }, [status, authData, navigate]);

  return (
    <div className="w-full max-w-[560px] flex flex-col items-start text-left">
      {status === "loading" && <VerifyLoadingView />}

      {status === "success" && authData && (
        <VerifySuccessView
          authData={authData}
          countdown={countdown}
          onNavigateNow={handleNavigateNow}
        />
      )}

      {status === "error" && <VerifyErrorView errorMessage={errorMessage} />}
    </div>
  );
};

export default VerifyEmailContent;
