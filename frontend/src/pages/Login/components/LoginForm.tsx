import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Formik, Form, FormikHelpers } from "formik";
import { loginSchema } from "@palmsight/shared";
import CommonIcons from "@/components/commonIcons";
import FormikField from "@/components/customFieldsFormik/FormikField";
import InputField from "@/components/customFieldsFormik/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import useLoginMutation from "../hooks/useLoginMutation";
import type { LoginFormValues } from "../types";

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
    <Formik
      initialValues={initialValues}
      validationSchema={loginSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="w-full max-w-md">
          <div className="mb-8 flex justify-center text-3xl font-bold text-primary font-mono">
            PalmSight
          </div>
          <Card className="shadow-md">
            <CardHeader className="pb-5">
              <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
              <p className="text-sm text-muted-foreground">
                Nhập email hoặc tên đăng nhập để tiếp tục
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {isResetSuccess && (
                <div
                  role="status"
                  className="p-3 bg-surface-card border border-terminal-success rounded text-sm text-ink flex items-center gap-2"
                >
                  <span className="font-bold text-terminal-success">[✓]</span>
                  <span>Đã đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.</span>
                </div>
              )}

              <FormikField
                component={InputField}
                name="login"
                label="Email hoặc username"
                placeholder="minhanh@example.com"
                required
              />

              <FormikField
                component={InputField}
                name="password"
                type="password"
                label="Mật khẩu"
                placeholder="••••••••"
                required
              />

              <div className="flex items-center justify-between text-sm">
                <Link
                  to={BaseUrl.ForgotPassword}
                  className="is-link text-muted-foreground hover:text-foreground"
                >
                  Quên mật khẩu?
                </Link>
                <Link
                  to={BaseUrl.Register}
                  className="is-link text-muted-foreground hover:text-foreground"
                >
                  Tạo tài khoản mới
                </Link>
              </div>

              <Button type="submit" isLoading={isSubmitting}>
                <CommonIcons.LogIn className="icon mr-2" /> Đăng nhập
              </Button>
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
