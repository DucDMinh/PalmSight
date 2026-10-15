import { Navigate } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

export const ForgotPassword = () => {
  const { isLogged } = useAuth();

  if (isLogged) {
    return <Navigate to={BaseUrl.Homepage} />;
  }

  return (
    <div className="component:ForgotPassword flex min-h-screen w-full items-center justify-center p-4 bg-canvas text-ink font-mono selection:bg-surface-card">
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPassword;
