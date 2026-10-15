import FormikField from "@/components/customFieldsFormik/FormikField";
import InputField from "@/components/customFieldsFormik/InputField";
import CheckBoxField from "@/components/customFieldsFormik/CheckBoxField";
import PasswordRules from "./PasswordRules";

interface RegisterFormFieldsProps {
  isSubmitting: boolean;
}

export const RegisterFormFields = ({ isSubmitting }: RegisterFormFieldsProps) => {
  return (
    <>
      <div className="mb-5">
        <FormikField
          component={InputField}
          name="displayName"
          label="Tên hiển thị"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          helperText="Tên hiển thị trên hồ sơ của bạn."
          showTerminalIcons
          disabled={isSubmitting}
          className="w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50"
        />
      </div>

      <div className="mb-5">
        <FormikField
          component={InputField}
          name="username"
          label="Tên đăng nhập"
          autoComplete="username"
          placeholder="minhanh"
          helperText="3–20 ký tự: chữ thường không dấu, số và dấu gạch dưới."
          errorTestId="error-username"
          showTerminalIcons
          disabled={isSubmitting}
          className="w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50"
        />
      </div>

      <div className="mb-5">
        <FormikField
          component={InputField}
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="minhanh@example.com"
          helperText="Chúng tôi gửi link xác thực tới email này."
          errorTestId="error-email"
          showTerminalIcons
          disabled={isSubmitting}
          className="w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50"
        />
      </div>

      <div className="mb-5">
        <FormikField
          component={InputField}
          name="password"
          type="password"
          label="Mật khẩu"
          autoComplete="new-password"
          placeholder="••••••••"
          helperText={<PasswordRules />}
          passwordToggleStyle="text"
          showTerminalIcons
          disabled={isSubmitting}
          className="w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50"
        />
      </div>

      <div className="mb-5">
        <FormikField
          component={InputField}
          name="confirmPassword"
          type="password"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          placeholder="••••••••"
          helperText="Nhập lại mật khẩu để xác nhận."
          passwordToggleStyle="text"
          showTerminalIcons
          disabled={isSubmitting}
          className="w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50"
        />
      </div>

      <div className="mb-5">
        <FormikField
          component={InputField}
          name="referralCode"
          label={
            <>
              Mã giới thiệu <span className="font-normal text-mute">(không bắt buộc)</span>
            </>
          }
          maxLength={8}
          placeholder="K7QX4MZP"
          helperText="Mã từ liên kết mời. Bạn có thể sửa hoặc xoá."
          showTerminalIcons
          disabled={isSubmitting}
          className="w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base uppercase outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50"
        />
      </div>

      <FormikField
        component={CheckBoxField}
        name="termsAccepted"
        terminalStyle
        disabled={isSubmitting}
        label={
          <>
            Tôi đồng ý với{" "}
            <a href="#terms" className="text-ink underline hover:text-charcoal">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="#privacy" className="text-ink underline hover:text-charcoal">
              Chính sách riêng tư
            </a>
            .
          </>
        }
      />
    </>
  );
};

export default RegisterFormFields;
