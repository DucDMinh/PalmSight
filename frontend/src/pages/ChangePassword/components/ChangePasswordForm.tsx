import { useState } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import { changePasswordSchema } from "@palmsight/shared";
import * as yup from "yup";
import FormikField from "@/components/customFieldsFormik/FormikField";
import InputField from "@/components/customFieldsFormik/InputField";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useChangePasswordMutation from "../hooks/useChangePasswordMutation";
import type { ChangePasswordFormValues } from "../types";

export const changePasswordValidationSchema = changePasswordSchema.shape({
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận lại mật khẩu")
    .oneOf([yup.ref("newPassword")], "Mật khẩu xác nhận không khớp"),
});

export const ChangePasswordForm = () => {
  const { toast } = useToast();
  const [success, setSuccess] = useState<boolean>(false);
  const changePasswordMutation = useChangePasswordMutation();

  const initialValues: ChangePasswordFormValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const onSubmit = async (
    values: ChangePasswordFormValues,
    { setSubmitting, resetForm }: FormikHelpers<ChangePasswordFormValues>
  ) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setSuccess(true);
      resetForm();
      toast({
        description: "Đổi mật khẩu thành công.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description:
          error?.response?.data?.error?.message ||
          error?.message ||
          "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={changePasswordValidationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="flex max-w-lg flex-col gap-4">
          {success && (
            <div className="p-3 bg-surface-card border border-terminal-success rounded text-sm text-ink flex items-center gap-2">
              <span className="font-bold text-terminal-success">[✓]</span>
              <span>Đổi mật khẩu thành công.</span>
            </div>
          )}

          <FormikField
            component={InputField}
            name="currentPassword"
            type="password"
            label="Mật khẩu hiện tại"
            required
            placeholder="Nhập mật khẩu hiện tại"
            disabled={isSubmitting}
          />

          <FormikField
            component={InputField}
            name="newPassword"
            type="password"
            label="Mật khẩu mới"
            required
            placeholder="Tối thiểu 8 ký tự"
            disabled={isSubmitting}
          />

          <FormikField
            component={InputField}
            name="confirmPassword"
            type="password"
            label="Xác nhận mật khẩu"
            required
            placeholder="Nhập lại mật khẩu mới"
            disabled={isSubmitting}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            Đổi mật khẩu
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default ChangePasswordForm;
