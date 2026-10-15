import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";
import VerifyEmailContent from "./components/VerifyEmailContent";
import { useAuth } from "@/providers/AuthenticationProvider";

export const VerifyEmailPage = () => {
  const { isLogged } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink font-mono flex flex-col selection:bg-surface-card">
      <AuthHeader rightAction={isLogged ? "user" : "login"} />

      <main className="flex-1 w-full max-w-[960px] mx-auto px-4 pt-16 md:pt-24 pb-24">
        <VerifyEmailContent />
      </main>

      <AuthFooter />
    </div>
  );
};

export default VerifyEmailPage;
