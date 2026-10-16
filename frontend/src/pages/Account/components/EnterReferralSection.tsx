import { useState } from "react";
import { Formik, Form } from "formik";
import { enterReferralSchema } from "@palmsight/shared";
import { useAuth } from "@/providers/AuthenticationProvider";
import { useQueryClient } from "@tanstack/react-query";
import { ME_QUERY_KEY } from "../hooks/useMeQuery";
import accountService from "../services";
import type { UserDto } from "../types";
import type { ApiErrorPayload } from "@/services/authService";

const ERROR_MESSAGE_MAP: Record<string, string> = {
  REFERRAL_SELF: "Bạn không thể nhập mã của chính mình",
  REFERRAL_CODE_NOT_FOUND: "Mã không tồn tại, kiểm tra lại",
  REFERRAL_ALREADY_USED: "Tài khoản đã nhập mã giới thiệu trước đó",
  REFERRAL_CYCLE: "Không thể nhập mã của người bạn đã mời",
  REFERRAL_NOT_ALLOWED: "Tài khoản không đủ điều kiện nhập mã",
};

interface EnterReferralSectionProps {
  user: UserDto | null;
}

export const EnterReferralSection = ({ user }: EnterReferralSectionProps) => {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const canEnter = user?.referral?.canEnterCode === true;
  const currentEnteredCode = user?.referral?.enteredCode || submittedCode;

  const handleSubmit = async (
    values: { code: string },
    { setSubmitting, setFieldError, resetForm }: any
  ) => {
    setGeneralError(null);
    try {
      const trimmedCode = values.code.trim().toUpperCase();
      const response = await accountService.enterReferral(trimmedCode);

      // Cập nhật creditBalance và referral vào context/store
      if (typeof response.creditBalance === "number") {
        updateUser({
          creditBalance: response.creditBalance,
          referral: {
            canEnterCode: false,
            enteredCode: trimmedCode,
          },
        });
      }

      setSubmittedCode(trimmedCode);
      const referrerName = response.referrer?.displayName || "bạn bè";
      setSuccessMessage(
        `[✓] Đã ghi nhận mã của ${referrerName}! Bạn được cộng 1 credit.`
      );

      // Làm mới query useMeQuery để cập nhật canEnterCode
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      resetForm();
    } catch (err: any) {
      const response = err?.response;
      const apiError = (response?.data?.error || response?.data || {}) as ApiErrorPayload;
      const errorCode = apiError.code;

      if (errorCode && ERROR_MESSAGE_MAP[errorCode]) {
        setGeneralError(ERROR_MESSAGE_MAP[errorCode]);
      } else if (response?.status === 400 && apiError.details?.fields) {
        apiError.details.fields.forEach((fieldError) => {
          if (fieldError.field === "code") {
            setFieldError("code", fieldError.message);
          }
        });
        setGeneralError(apiError.message || "Mã giới thiệu không hợp lệ.");
      } else {
        setGeneralError(
          apiError.message ||
            "Không thể xử lý mã giới thiệu. Vui lòng kiểm tra lại."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="nhap-ma" className="mt-16 scroll-mt-20 font-mono text-ink">
      <div className="pb-2 border-b border-hairline">
        <h2 className="text-lg font-bold">Nhập mã giới thiệu</h2>
      </div>

      <div className="mt-6">
        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="p-3 mb-4 text-sm border border-hairline bg-surface-soft text-ink rounded-[4px]"
          >
            {successMessage}
          </div>
        )}

        {/* Display when already entered code */}
        {currentEnteredCode ? (
          <div
            data-testid="entered-code-display"
            className="p-4 bg-surface-card border border-hairline rounded-[4px] text-sm text-ink font-medium"
          >
            [✓] Đã nhập mã giới thiệu: {currentEnteredCode}
          </div>
        ) : canEnter ? (
          <Formik
            initialValues={{ code: "" }}
            validationSchema={enterReferralSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              isSubmitting,
            }) => (
              <Form
                className="w-full max-w-[480px] flex flex-col"
                noValidate
                data-testid="enter-referral-form"
              >
                {generalError && (
                  <div
                    role="alert"
                    className="p-3 mb-4 text-sm border border-terminal-danger/40 bg-terminal-danger/5 text-terminal-danger rounded-[4px]"
                  >
                    {generalError}
                  </div>
                )}

                <label
                  htmlFor="referral-code-input"
                  className="text-sm font-bold text-ink mb-2 block cursor-pointer"
                >
                  Mã giới thiệu từ bạn bè
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="referral-code-input"
                    name="code"
                    type="text"
                    maxLength={8}
                    autoComplete="off"
                    spellCheck={false}
                    value={values.code}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      handleChange(e);
                    }}
                    onBlur={handleBlur}
                    placeholder="K7QX4MZP"
                    className="flex-1 h-10 px-3 bg-canvas text-ink border border-ink rounded-[4px] text-base font-normal tracking-[2px] uppercase outline-none focus:border-ink"
                    aria-invalid={Boolean(touched.code && errors.code)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-5 bg-ink text-canvas font-medium rounded-[4px] hover:bg-charcoal transition-colors cursor-pointer select-none text-sm disabled:opacity-50 shrink-0"
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận mã"}
                  </button>
                </div>

                {touched.code && errors.code ? (
                  <div className="text-xs text-terminal-danger mt-1">
                    {errors.code}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-mute">
                    [i] Mã gồm 8 ký tự in hoa. Nhập mã để nhận ngay 1 credit.
                  </div>
                )}
              </Form>
            )}
          </Formik>
        ) : (
          <div
            data-testid="referral-not-eligible"
            className="p-4 bg-surface-card border border-hairline rounded-[4px] text-sm text-mute"
          >
            Tài khoản không đủ điều kiện nhập mã.
          </div>
        )}
      </div>
    </section>
  );
};

export default EnterReferralSection;
