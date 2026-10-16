import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Formik, Form, FormikHelpers } from "formik";
import * as yup from "yup";
import { registerFormSchema } from "@palmsight/shared";
import { getCookie } from "@/helpers/cookie";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import RegisterFormFields from "./RegisterFormFields";
import RegisterSocialActions from "./RegisterSocialActions";
import useRegisterMutation from "../hooks/useRegisterMutation";
import type { RegisterFormValues } from "../types";
import type { ApiErrorPayload } from "@/services/authService";

export const registerValidationSchema = registerFormSchema.shape({
  termsAccepted: yup
    .boolean()
    .oneOf([true], "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách riêng tư.")
    .required("Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách riêng tư."),
});

const handleSubmissionError = (
  err: any,
  setErrors: (errors: Record<string, string>) => void,
  setGeneralError: (msg: string | null) => void,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  const response = err?.response;
  const status = response?.status;
  const apiError = (response?.data?.error || {}) as ApiErrorPayload;

  if (status === 409) {
    if (apiError.code === "EMAIL_TAKEN") {
      const errorMessage = apiError.message || "Email này đã được sử dụng.";
      setErrors({ email: errorMessage });
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    } else if (apiError.code === "USERNAME_TAKEN") {
      setErrors({ username: apiError.message || "Tên người dùng đã được sử dụng." });
    } else {
      setGeneralError(apiError.message || "Thông tin đăng ký bị xung đột.");
    }
  } else if (status === 400 && apiError.details?.fields) {
    const serverErrors: Record<string, string> = {};
    apiError.details.fields.forEach((f) => {
      serverErrors[f.field] = f.message;
    });
    setErrors(serverErrors);
  } else if (status === 429) {
    setGeneralError(
      apiError.message || "Bạn đã gửi quá số lần cho phép. Vui lòng thử lại sau ít phút."
    );
  } else {
    setGeneralError(apiError.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
  }
};

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { toast } = useToast();
  const registerMutation = useRegisterMutation();

  const initialReferralCode = useMemo(() => {
    const fromQuery = searchParams.get("ref") || searchParams.get("referralCode");
    const fromCookie = getCookie("ref_code");
    return (fromQuery || fromCookie || "").trim().toUpperCase();
  }, [searchParams]);

  const initialValues: RegisterFormValues = {
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: initialReferralCode,
    termsAccepted: false,
  };

  const onSubmit = async (
    values: RegisterFormValues,
    { setErrors, setSubmitting }: FormikHelpers<RegisterFormValues>
  ) => {
    setGeneralError(null);
    try {
      const payload = {
        displayName: values.displayName.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        ...(values.referralCode?.trim()
          ? { referralCode: values.referralCode.trim().toUpperCase() }
          : {}),
      };

      const result = await registerMutation.mutateAsync(payload);
      navigate(
        `${BaseUrl.CheckEmail}?email=${encodeURIComponent(result.email || values.email)}`,
        { state: { email: result.email || values.email } }
      );
    } catch (err: any) {
      handleSubmissionError(err, setErrors, setGeneralError, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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

      <Formik
        initialValues={initialValues}
        validationSchema={registerValidationSchema}
        onSubmit={onSubmit}
        validateOnBlur
        validateOnChange
      >
        {({ isSubmitting }) => (
          <Form noValidate>
            <RegisterFormFields isSubmitting={isSubmitting} />
            <RegisterSocialActions isSubmitting={isSubmitting} />
          </Form>
        )}
      </Formik>
    </section>
  );
};

export default RegisterForm;
