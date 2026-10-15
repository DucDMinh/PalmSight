import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";

interface RegisterSocialActionsProps {
  isSubmitting: boolean;
}

export const RegisterSocialActions = ({ isSubmitting }: RegisterSocialActionsProps) => {
  return (
    <>
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-9 bg-ink text-canvas rounded font-medium text-base px-5 flex items-center justify-center cursor-pointer transition-colors hover:bg-ink-deep active:bg-ink-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "[...] Đang đăng ký..." : "Tạo tài khoản"}
        </button>
      </div>

      <div className="relative text-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-canvas px-4 text-sm text-mute">hoặc</span>
        </div>
      </div>

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

      <div className="mt-6 text-sm text-mute">
        Đã có tài khoản?{" "}
        <Link to={BaseUrl.Login} className="text-ink underline hover:text-charcoal">
          Đăng nhập
        </Link>
      </div>
    </>
  );
};

export default RegisterSocialActions;
