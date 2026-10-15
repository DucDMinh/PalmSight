import PageWrapper from "@/components/PageWrapper";
import ChangePasswordForm from "./components/ChangePasswordForm";

export const ChangePassword = () => {
  return (
    <PageWrapper>
      <div className="component:ChangePassword max-w-lg mx-auto py-8">
        <h1 className="mb-8 text-2xl font-bold md:text-3xl font-mono text-ink">
          Đổi mật khẩu
        </h1>
        <ChangePasswordForm />
      </div>
    </PageWrapper>
  );
};

export default ChangePassword;
