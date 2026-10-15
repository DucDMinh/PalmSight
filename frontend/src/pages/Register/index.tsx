import AuthHeader from "@/components/AuthHeader";
import RegisterHeader from "./components/RegisterHeader";
import RegisterForm from "./components/RegisterForm";
import RegisterFooter from "./components/RegisterFooter";

export const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-canvas text-ink font-mono flex flex-col selection:bg-surface-card">
      <AuthHeader rightAction="login" />

      <main className="flex-1 w-full max-w-[960px] mx-auto my-12 md:my-20 px-4 flex flex-col md:flex-row gap-8 md:gap-0 items-start">
        <RegisterHeader />
        <div className="hidden md:block w-[1px] bg-hairline self-stretch min-h-[580px]" />
        <RegisterForm />
      </main>

      <RegisterFooter />
    </div>
  );
};

export default RegisterPage;
