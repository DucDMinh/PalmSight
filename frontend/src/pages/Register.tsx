import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getCookie } from "@/helpers/cookie";
import authService, { ApiErrorPayload } from "@/services/authService";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";
import BaseUrl from "@/consts/baseUrl";
import { registerFormSchema } from "@palmsight/shared";
import * as yup from "yup";

interface FormValues {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  termsAccepted: boolean;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form values
  const [values, setValues] = useState<FormValues>({
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    termsAccepted: false,
  });

  // UX states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Prefill referralCode from cookie or query parameter
  useEffect(() => {
    const codeFromQuery = searchParams.get("ref") || searchParams.get("referralCode");
    const codeFromCookie = getCookie("ref_code");
    const prefillCode = (codeFromQuery || codeFromCookie || "").trim().toUpperCase();

    if (prefillCode) {
      setValues((prev) => ({
        ...prev,
        referralCode: prefillCode,
      }));
    }
  }, [searchParams]);

  const handleChange = (
    field: keyof FormValues,
    value: string | boolean
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: typeof value === "string" && field === "referralCode" ? value.toUpperCase() : value,
    }));

    // Clear specific field error on typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side schema validation using @palmsight/shared registerFormSchema
    try {
      if (!values.termsAccepted) {
        setFieldErrors({
          termsAccepted: "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách riêng tư.",
        });
        return;
      }

      await registerFormSchema.validate(
        {
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          referralCode: values.referralCode || undefined,
        },
        { abortEarly: false }
      );
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((validationErr) => {
          if (validationErr.path && !errors[validationErr.path]) {
            errors[validationErr.path] = validationErr.message;
          }
        });
        setFieldErrors(errors);
        return;
      }
    }

    // Call API
    setIsSubmitting(true);
    try {
      const payload = {
        displayName: values.displayName.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        ...(values.referralCode.trim()
          ? { referralCode: values.referralCode.trim().toUpperCase() }
          : {}),
      };

      const result = await authService.postRegister(payload);

      // Navigate to Check Email page with email state
      navigate(`${BaseUrl.CheckEmail}?email=${encodeURIComponent(result.email || values.email)}`, {
        state: { email: result.email || values.email },
      });
    } catch (err: any) {
      const response = err?.response;
      const status = response?.status;
      const apiError = (response?.data?.error || {}) as ApiErrorPayload;

      if (status === 409) {
        if (apiError.code === "EMAIL_TAKEN") {
          setFieldErrors((prev) => ({
            ...prev,
            email: apiError.message || "Email này đã được sử dụng.",
          }));
        } else if (apiError.code === "USERNAME_TAKEN") {
          setFieldErrors((prev) => ({
            ...prev,
            username: apiError.message || "Tên người dùng đã được sử dụng.",
          }));
        } else {
          setGeneralError(apiError.message || "Thông tin đăng ký bị xung đột.");
        }
      } else if (status === 400 && apiError.details?.fields) {
        const serverFieldErrors: Record<string, string> = {};
        apiError.details.fields.forEach((f) => {
          serverFieldErrors[f.field] = f.message;
        });
        setFieldErrors(serverFieldErrors);
      } else if (status === 429) {
        setGeneralError(
          apiError.message ||
            "Bạn đã gửi quá số lần cho phép. Vui lòng thử lại sau ít phút."
        );
      } else {
        setGeneralError(
          apiError.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-mono flex flex-col selection:bg-surface-card">
      <AuthHeader rightAction="login" />

      <main className="flex-1 w-full max-w-[960px] mx-auto my-12 md:my-20 px-4 flex flex-col md:flex-row gap-8 md:gap-0 items-start">
        {/* Left Column (360px) */}
        <section className="w-full md:w-[360px] md:pr-12">
          <h1 className="text-[34px] md:text-[38px] font-bold text-ink leading-tight mb-4 tracking-normal">
            Tạo tài khoản
          </h1>
          <p className="text-base text-body mb-8">
            Xác thực email để nhận 3 credits.
          </p>

          <div className="border-t border-hairline">
            <div className="py-2.5 border-b border-hairline text-base text-body flex items-center">
              <span className="font-bold text-ink mr-2">[+]</span>
              <span>1 lần xem bói = 1 credit</span>
            </div>
            <div className="py-2.5 border-b border-hairline text-base text-body flex items-center">
              <span className="font-bold text-ink mr-2">[+]</span>
              <span>Chọn phương Tây, phương Đông hoặc Ấn Độ</span>
            </div>
            <div className="py-2.5 border-b border-hairline text-base text-body flex items-center">
              <span className="font-bold text-ink mr-2">[+]</span>
              <span>Xoá ảnh và dữ liệu bất cứ lúc nào</span>
            </div>
          </div>
        </section>

        {/* Vertical Hairline Divider */}
        <div className="hidden md:block w-[1px] bg-hairline self-stretch min-h-[580px]" />

        {/* Right Column (480px, Form) */}
        <section className="w-full md:w-[480px] md:pl-12">
          {generalError && (
            <div
              role="alert"
              className="mb-6 p-3 bg-error-container/30 border border-terminal-danger text-ink rounded text-sm flex items-start gap-2"
            >
              <span className="font-bold text-terminal-danger">[!]</span>
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* 1. Tên hiển thị */}
            <div className="mb-5">
              <label htmlFor="displayName" className="block text-base font-bold text-ink mb-2">
                Tên hiển thị
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={values.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.displayName)}
                  aria-describedby={fieldErrors.displayName ? "displayName-error" : "displayName-hint"}
                  className={`w-full h-10 bg-surface-soft border ${
                    fieldErrors.displayName ? "border-terminal-danger" : "border-hairline"
                  } rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50`}
                />
              </div>
              {fieldErrors.displayName ? (
                <p id="displayName-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1">
                  <span className="font-bold">[!]</span> {fieldErrors.displayName}
                </p>
              ) : (
                <p id="displayName-hint" className="text-sm text-mute mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-mute">[i]</span> Tên hiển thị trên hồ sơ của bạn.
                </p>
              )}
            </div>

            {/* 2. Tên đăng nhập */}
            <div className="mb-5">
              <label htmlFor="username" className="block text-base font-bold text-ink mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="minhanh"
                  value={values.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={fieldErrors.username ? "username-error" : "username-hint"}
                  className={`w-full h-10 bg-surface-soft border ${
                    fieldErrors.username ? "border-terminal-danger" : "border-hairline"
                  } rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50`}
                />
              </div>
              {fieldErrors.username ? (
                <p id="username-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1" data-testid="error-username">
                  <span className="font-bold">[!]</span> {fieldErrors.username}
                </p>
              ) : (
                <p id="username-hint" className="text-sm text-mute mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-mute">[i]</span> 3–20 ký tự: chữ thường không dấu, số và dấu gạch dưới.
                </p>
              )}
            </div>

            {/* 3. Email */}
            <div className="mb-5">
              <label htmlFor="email" className="block text-base font-bold text-ink mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="minhanh@example.com"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : "email-hint"}
                  className={`w-full h-10 bg-surface-soft border ${
                    fieldErrors.email ? "border-terminal-danger" : "border-hairline"
                  } rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50`}
                />
              </div>
              {fieldErrors.email ? (
                <p id="email-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1" data-testid="error-email">
                  <span className="font-bold">[!]</span> {fieldErrors.email}
                </p>
              ) : (
                <p id="email-hint" className="text-sm text-mute mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-mute">[i]</span> Chúng tôi gửi link xác thực tới email này.
                </p>
              )}
            </div>

            {/* 4. Mật khẩu */}
            <div className="mb-5">
              <label htmlFor="password" className="block text-base font-bold text-ink mb-2">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                  className={`w-full h-10 bg-surface-soft border ${
                    fieldErrors.password ? "border-terminal-danger" : "border-hairline"
                  } rounded px-3 py-2 pr-16 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-sm text-ink underline cursor-pointer hover:text-charcoal"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="password-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1">
                  <span className="font-bold">[!]</span> {fieldErrors.password}
                </p>
              ) : (
                <p id="password-hint" className="text-sm text-mute mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-mute">[i]</span> Tối thiểu 8 ký tự.
                </p>
              )}
            </div>

            {/* 5. Xác nhận mật khẩu */}
            <div className="mb-5">
              <label htmlFor="confirmPassword" className="block text-base font-bold text-ink mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={values.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : "confirmPassword-hint"}
                  className={`w-full h-10 bg-surface-soft border ${
                    fieldErrors.confirmPassword ? "border-terminal-danger" : "border-hairline"
                  } rounded px-3 py-2 pr-16 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-sm text-ink underline cursor-pointer hover:text-charcoal"
                >
                  {showConfirmPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <p id="confirmPassword-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1">
                  <span className="font-bold">[!]</span> {fieldErrors.confirmPassword}
                </p>
              ) : (
                <p id="confirmPassword-hint" className="text-sm text-mute mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-mute">[i]</span> Nhập lại mật khẩu để xác nhận.
                </p>
              )}
            </div>

            {/* 6. Mã giới thiệu */}
            <div className="mb-5">
              <label htmlFor="referralCode" className="block text-base font-bold text-ink mb-2">
                Mã giới thiệu <span className="font-normal text-mute">(không bắt buộc)</span>
              </label>
              <div className="relative">
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  maxLength={8}
                  placeholder="K7QX4MZP"
                  value={values.referralCode}
                  onChange={(e) => handleChange("referralCode", e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.referralCode)}
                  aria-describedby={fieldErrors.referralCode ? "referralCode-error" : "referralCode-hint"}
                  className={`w-full h-10 bg-surface-soft border ${
                    fieldErrors.referralCode ? "border-terminal-danger" : "border-hairline"
                  } rounded px-3 py-2 text-ink placeholder:text-ash text-base uppercase outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50`}
                />
              </div>
              {fieldErrors.referralCode ? (
                <p id="referralCode-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1">
                  <span className="font-bold">[!]</span> {fieldErrors.referralCode}
                </p>
              ) : (
                <p id="referralCode-hint" className="text-sm text-mute mt-1.5 flex items-center gap-1">
                  <span className="font-medium text-mute">[i]</span> Mã từ liên kết mời. Bạn có thể sửa hoặc xoá.
                </p>
              )}
            </div>

            {/* 7. Checkbox Điều khoản */}
            <div className="mb-6">
              <label
                htmlFor="termsAccepted"
                className="flex items-start gap-2.5 cursor-pointer select-none text-base text-body"
              >
                <input
                  id="termsAccepted"
                  type="checkbox"
                  checked={values.termsAccepted}
                  onChange={(e) => handleChange("termsAccepted", e.target.checked)}
                  disabled={isSubmitting}
                  className="sr-only"
                  aria-invalid={Boolean(fieldErrors.termsAccepted)}
                  aria-describedby={fieldErrors.termsAccepted ? "termsAccepted-error" : undefined}
                />
                <span className="font-bold text-ink select-none" aria-hidden="true">
                  {values.termsAccepted ? "[x]" : "[ ]"}
                </span>
                <span>
                  Tôi đồng ý với{" "}
                  <a href="#terms" className="text-ink underline hover:text-charcoal">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="#privacy" className="text-ink underline hover:text-charcoal">
                    Chính sách riêng tư
                  </a>
                  .
                </span>
              </label>
              {fieldErrors.termsAccepted && (
                <p id="termsAccepted-error" className="text-sm text-terminal-danger mt-1.5 flex items-center gap-1">
                  <span className="font-bold">[!]</span> {fieldErrors.termsAccepted}
                </p>
              )}
            </div>

            {/* Primary CTA Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9 bg-ink text-canvas rounded font-medium text-base px-5 flex items-center justify-center cursor-pointer transition-colors hover:bg-ink-deep active:bg-ink-deep disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "[...] Đang đăng ký..." : "Tạo tài khoản"}
              </button>
            </div>

            {/* Divider "hoặc" */}
            <div className="relative text-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-canvas px-4 text-sm text-mute">hoặc</span>
              </div>
            </div>

            {/* Secondary Buttons Stack */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full h-9 bg-canvas text-ink border border-hairline-strong rounded font-medium text-base px-5 flex items-center justify-center hover:bg-surface-card transition-colors cursor-pointer"
              >
                <span className="font-bold mr-2">[G]</span> Đăng ký với Google
              </button>
              <button
                type="button"
                className="w-full h-9 bg-canvas text-ink border border-hairline-strong rounded font-medium text-base px-5 flex items-center justify-center hover:bg-surface-card transition-colors cursor-pointer"
              >
                <span className="font-bold mr-2">[f]</span> Đăng ký với Facebook
              </button>
            </div>

            {/* Caption bottom */}
            <div className="mt-6 text-sm text-mute">
              Đã có tài khoản?{" "}
              <Link to={BaseUrl.Login} className="text-ink underline hover:text-charcoal">
                Đăng nhập
              </Link>
            </div>
          </form>
        </section>
      </main>

      <AuthFooter />
    </div>
  );
};

export default RegisterPage;
