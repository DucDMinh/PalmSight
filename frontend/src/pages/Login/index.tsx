import { Navigate } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import LoginForm from "./components/LoginForm";

export const LoginPage = () => {
  const { isLogged } = useAuth();

  if (isLogged) {
    return <Navigate to={BaseUrl.Homepage} />;
  }

  return (
    <div className="component:Login flex min-h-screen w-full items-center justify-center p-4 bg-canvas text-ink font-mono selection:bg-surface-card">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
