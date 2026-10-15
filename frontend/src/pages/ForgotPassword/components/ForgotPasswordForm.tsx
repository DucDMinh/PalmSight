import { useState } from "react";
import { Link } from "react-router-dom";
import { Formik, Form, FormikHelpers } from "formik";
import { forgotPasswordSchema } from "@palmsight/shared";
import FormikField from "@/components/customFieldsFormik/FormikField";
import InputField from "@/components/customFieldsFormik/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import useForgotPasswordMutation from "../hooks/useForgotPasswordMutation";
import type { ForgotPasswordFormValues } from "../types";

export const ForgotPasswordForm = () => {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const forgotPasswordMutation = useForgotPasswordMutation();

  const initialValues: ForgotPasswordFormValues = {
    email: "",
  };

  const onSubmit = async (
    values: ForgotPasswordFormValues,
    { setSubmitting }: FormikHelpers<ForgotPasswordFormValues>
  ) => {
    try {
      await forgotPasswordMutation.mutateAsync({
        email: values.email.trim().toLowerCase(),
      });
      setIsSuccess(true);
      toast({
        description: "Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description:
          error?.response?.data?.error?.message ||
          error?.message ||
          "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={forgotPasswordSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="w-full max-w-md">
          <Card className="shadow-md">
            <CardHeader className="pb-5">
              <h1 className="text-xl font-semibold tracking-tight">Quên mật khẩu</h1>
              <p className="text-sm text-muted-foreground">
                Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isSuccess ? (
                <div className="p-3 bg-surface-card border border-terminal-success rounded text-sm text-ink flex items-center gap-2">
                  <span className="font-bold text-terminal-success">[✓]</span>
                  <span>Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi.</span>
                </div>
              ) : (
                <>
                  <FormikField
                    component={InputField}
                    name="email"
                    type="email"
                    label="Email"
                    placeholder="your-email@gmail.com"
                    required
                  />

                  <Button type="submit" isLoading={isSubmitting}>
                    Tiếp tục
                  </Button>
                </>
              )}

              <p className="text-center text-sm text-muted-foreground mt-2">
                Đã có tài khoản?{" "}
                <Link to={BaseUrl.Login} className="is-link text-ink underline">
                  Đăng nhập
                </Link>
              </p>
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default ForgotPasswordForm;
