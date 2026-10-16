import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";

export const CtaSection = () => {
  const { isLogged } = useAuth();

  return (
    <section className="max-w-[960px] mx-auto px-4 mt-[96px] text-left w-full">
      <Link
        to={isLogged ? BaseUrl.Scan : BaseUrl.Login}
        className="btn-primary"
      >
        Bắt đầu xem bói
      </Link>
    </section>
  );
};

export default CtaSection;
