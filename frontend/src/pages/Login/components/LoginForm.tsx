import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Formik, Form, FormikHelpers } from "formik";
import { loginSchema } from "@palmsight/shared";
import FormikField from "@/components/customFieldsFormik/FormikField";
import InputField from "@/components/customFieldsFormik/InputField";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import useLoginMutation from "../hooks/useLoginMutation";
import type { LoginFormValues } from "../types";

const inputClassName =
  "w-full h-10 bg-surface-soft border-hairline rounded px-3 py-2 text-ink placeholder:text-ash text-base outline-none focus:bg-canvas focus:border-ink transition-colors disabled:opacity-50";

export const LoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { setAuthSession } = useAuth();
  const loginMutation = useLoginMutation();
  const isResetSuccess = searchParams.get("reset") === "1";

  const initialValues: LoginFormValues = {
    login: "",
    password: "",
  };

  const onSubmit = async (
    values: LoginFormValues,
    { setSubmitting }: FormikHelpers<LoginFormValues>
  ) => {
    try {
      const data = await loginMutation.mutateAsync({
        login: values.login.trim().toLowerCase(),
        password: values.password,
      });

      setAuthSession({
        accessToken: data.accessToken,
        user: data.user,
      });

      const destination = data.isNewUser ? BaseUrl.ReferralEnter : BaseUrl.Scan;
      navigate(destination);
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast({
        variant: "destructive",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-sm">
      <h1 className="text-[28px] md:text-[32px] font-bold text-ink leading-tight tracking-normal">
        Đăng nhập
      </h1>
      <p className="text-sm text-body mt-1 mb-6">
        Dùng email hoặc tên đăng nhập của bạn.
      </p>

      {isResetSuccess && (
        <div
          role="status"
          className="mb-5 p-3 bg-surface-card border border-terminal-success rounded text-sm text-ink flex items-start gap-2"
        >
          <span className="font-bold text-terminal-success">[✓]</span>
          <span>Đã đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.</span>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={loginSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="flex flex-col gap-4">
            <FormikField
              component={InputField}
              name="login"
              label="Email hoặc username"
              autoComplete="username"
              placeholder="minhanh@example.com"
              showTerminalIcons
              disabled={isSubmitting}
              className={inputClassName}
            />

            <div className="relative">
              <FormikField
                component={InputField}
                name="password"
                type="password"
                label="Mật khẩu"
                autoComplete="current-password"
                placeholder="••••••••"
                passwordToggleStyle="text"
                showTerminalIcons
                disabled={isSubmitting}
                className={inputClassName}
              />
              <Link
                to={BaseUrl.ForgotPassword}
                className="absolute right-0 top-0 text-sm text-mute underline hover:text-ink"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full h-9 bg-ink text-canvas rounded font-medium text-base px-5 flex items-center justify-center cursor-pointer transition-colors hover:bg-ink-deep active:bg-ink-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "[...] Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </Form>
        )}
      </Formik>

      <SocialLoginButtons />

      <p className="mt-5 text-sm text-mute">
        Chưa có tài khoản?{" "}
        <Link to={BaseUrl.Register} className="text-ink underline hover:text-charcoal">
          Tạo tài khoản mới
        </Link>
      </p>
    </section>
  );
};

export default LoginForm;
