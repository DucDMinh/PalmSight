import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import { loadGoogleIdentityScript } from "@/helpers/googleIdentity";
import { useAuth } from "@/providers/AuthenticationProvider";
import authService from "@/services/authService";

type ButtonStatus = "loading" | "ready" | "submitting" | "unavailable";

const GOOGLE_SCOPES = "openid email profile";

export const GoogleLoginButton = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuthSession } = useAuth();
  const codeClientRef = useRef<GoogleCodeClient | null>(null);
  const [status, setStatus] = useState<ButtonStatus>(clientId ? "loading" : "unavailable");

  //! Google calls this with an authorization code after the user picks an account in the popup
  // Kept in a ref so the code client created once always sees the latest navigate/toast
  const handleCodeRef = useRef<(response: GoogleCodeResponse) => void>();
  handleCodeRef.current = async ({ code, error }: GoogleCodeResponse) => {
    if (!code) {
      setStatus("ready");
      if (error && error !== "access_denied") {
        toast({ variant: "destructive", description: "Đăng nhập Google thất bại. Vui lòng thử lại." });
      }
      return;
    }

    try {
      const data = await authService.postGoogleLogin({ code });
      setAuthSession({ accessToken: data.accessToken, user: data.user });
      navigate(data.isNewUser ? BaseUrl.ReferralEnter : BaseUrl.Scan);
    } catch (err: any) {
      setStatus("ready");
      toast({
        variant: "destructive",
        description:
          err?.response?.data?.error?.message || "Đăng nhập Google thất bại. Vui lòng thử lại.",
      });
    }
  };

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (cancelled) return;
        if (!oauth2) {
          setStatus("unavailable");
          return;
        }

        codeClientRef.current = oauth2.initCodeClient({
          client_id: clientId,
          scope: GOOGLE_SCOPES,
          ux_mode: "popup",
          callback: (response) => handleCodeRef.current?.(response),
          // Fired when the popup is closed or blocked before an account is picked
          error_callback: () => setStatus("ready"),
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

  const handleGoogleClick = () => {
    if (status !== "ready" || !codeClientRef.current) return;
    setStatus("submitting");
    codeClientRef.current.requestCode();
  };

  const labelText =
    status === "submitting" ? "[...] Đang đăng nhập bằng Google..." : "Đăng nhập bằng Google";

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={status !== "ready"}
      title={status === "unavailable" ? "Đăng nhập Google hiện chưa khả dụng" : undefined}
      className="w-full btn-secondary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {status !== "submitting" && <span className="font-bold text-[#d4af37] mr-1">[G]</span>}
      {labelText}
    </button>
  );
};

export default GoogleLoginButton;
