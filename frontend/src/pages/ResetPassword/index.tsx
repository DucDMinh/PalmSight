import ResetPasswordForm from "./components/ResetPasswordForm";

// Open to logged-in users too: a Google-only user sets a first password from /account,
// then opens the emailed link in the same browser
export const ResetPassword = () => {
  return (
    <div className="component:ResetPassword flex-1 w-full max-w-[960px] mx-auto my-12 md:my-20 px-4 flex flex-col md:flex-row gap-8 md:gap-0 items-start font-mono text-ink">
      {/* Left Column: 360px */}
      <section className="w-full md:w-[360px] md:pr-12 flex flex-col items-start text-left">
        <h1 className="text-3xl md:text-[38px] font-bold text-ink leading-tight mb-4 tracking-normal">
          Đặt lại mật khẩu
        </h1>
        <p className="text-base text-body mb-6">
          Chọn mật khẩu mới cho tài khoản của bạn.
        </p>

        <div className="w-full border-t border-hairline pt-3">
          <div className="py-2 border-b border-hairline text-sm text-body flex items-center">
            <span className="font-bold text-ink mr-2">[+]</span>
            <span>Mật khẩu tối thiểu 8 ký tự</span>
          </div>
          <div className="py-2 border-b border-hairline text-sm text-body flex items-center">
            <span className="font-bold text-ink mr-2">[+]</span>
            <span>Thu hồi toàn bộ phiên đăng nhập cũ</span>
          </div>
        </div>
      </section>

      {/* Vertical 1px Hairline Rule */}
      <div className="hidden md:block w-[1px] bg-hairline self-stretch min-h-[360px]" />

      {/* Right Column: 480px */}
      <section className="w-full md:w-[480px] md:pl-12 flex flex-col items-start text-left">
        <ResetPasswordForm />
      </section>
    </div>
  );
};

export default ResetPassword;
