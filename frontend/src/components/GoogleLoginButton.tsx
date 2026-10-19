import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import { loadGoogleIdentityScript } from "@/helpers/googleIdentity";
import { useAuth } from "@/providers/AuthenticationProvider";
import authService from "@/services/authService";

type ButtonStatus = "loading" | "ready" | "submitting" | "unavailable";

const MAX_GOOGLE_BUTTON_WIDTH = 400;

export const GoogleLoginButton = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { setAuthSession } = useAuth();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ButtonStatus>(clientId ? "loading" : "unavailable");

  //! Google calls this with the ID token after the user picks an account
  // Kept in a ref so the GIS callback registered once always sees the latest navigate/toast
  const handleCredentialRef = useRef<(response: GoogleCredentialResponse) => void>();
  handleCredentialRef.current = async ({ credential }: GoogleCredentialResponse) => {
    setStatus("submitting");
    let claimToken = searchParams.get("claimToken");
    if (!claimToken) {
      try {
        claimToken =
          sessionStorage.getItem("ps_claim_token") ||
          localStorage.getItem("ps_claim_token");
      } catch {
        // Storage fallback
      }
    }

    try {
      const data = await authService.postGoogleLogin({
        idToken: credential,
        ...(claimToken ? { claimToken } : {}),
      });
      if (data.claimedReadingId) {
        try {
          sessionStorage.removeItem("ps_claim_token");
          localStorage.removeItem("ps_claim_token");
        } catch {
          // Storage fallback
        }
      }
      setAuthSession({ accessToken: data.accessToken, user: data.user });
      if (data.claimedReadingId) {
        navigate(`/readings/${data.claimedReadingId}`);
      } else {
        navigate(data.isNewUser ? BaseUrl.ReferralEnter : BaseUrl.Scan);
      }
    } catch (error: any) {
      setStatus("ready");
      toast({
        variant: "destructive",
        description:
          error?.response?.data?.error?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.",
      });
    }
  };

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        const gsi = window.google?.accounts?.id;
        if (cancelled || !gsi || !googleButtonRef.current) return;

        gsi.initialize({
          client_id: clientId,
          callback: (response) => handleCredentialRef.current?.(response),
          ux_mode: "popup",
        });

        const wrapperWidth = wrapperRef.current?.offsetWidth || MAX_GOOGLE_BUTTON_WIDTH;
        gsi.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: Math.min(wrapperWidth, MAX_GOOGLE_BUTTON_WIDTH),
          locale: "vi",
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const placeholderText =
    status === "submitting" ? "[...] Đang đăng nhập bằng Google..." : "Đăng nhập bằng Google";

  return (
    <div ref={wrapperRef} className="w-full">
      <div
        ref={googleButtonRef}
        className={status === "ready" ? "flex justify-center min-h-[44px]" : "hidden"}
      />
      {status !== "ready" && (
        <button
          type="button"
          disabled
          title={status === "unavailable" ? "Đăng nhập Google hiện chưa khả dụng" : undefined}
          className="w-full h-9 bg-canvas text-ink border border-hairline-strong rounded font-medium text-base px-5 flex items-center justify-center opacity-60 cursor-not-allowed"
        >
          {status !== "submitting" && <span className="font-bold mr-2">[G]</span>}
          {placeholderText}
        </button>
      )}
    </div>
  );
};

export default GoogleLoginButton;
