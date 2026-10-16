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
