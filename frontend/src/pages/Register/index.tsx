import RegisterHeader from "./components/RegisterHeader";
import RegisterForm from "./components/RegisterForm";

export const RegisterPage = () => {
  return (
    <div className="flex-1 w-full max-w-[960px] mx-auto my-12 md:my-20 px-4 flex flex-col md:flex-row gap-8 md:gap-0 items-start">
      <RegisterHeader />
      <div className="hidden md:block w-[1px] bg-hairline self-stretch min-h-[580px]" />
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
