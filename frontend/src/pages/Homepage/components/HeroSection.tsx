import React from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";

const ASCII_WORDMARK = `███ ███ █   █ █ ███ ███ ███ █ █ ███
█ █ █ █ █   ███ █    █  █   █ █  █
███ ███ █   ███ ███  █  █ █ ███  █
█   █ █ █   █ █   █  █  █ █ █ █  █
█   █ █ ███ █ █ ███ ███ ███ █ █  █`;

export const HeroSection = () => {
  const { isLogged } = useAuth();

  const handleScrollToSample = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("vi-du-ket-qua");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full pt-[48px] sm:pt-[96px]">
      <div className="max-w-[960px] mx-auto px-4 text-left">
        {/* Dark badge */}
        <div className="inline-block bg-[#201d1d] text-[#fdfcfc] text-[14px] font-[400] rounded-[4px] px-[8px] py-[2px] mb-4 select-none">
          Miễn phí 3 credits
        </div>

        {/* H1 */}
        <h1 className="text-[32px] sm:text-[38px] leading-[1.3] font-[700] text-[#201d1d] max-w-[720px] mb-4">
          Chụp lòng bàn tay. AI đọc chỉ tay giúp bạn.
        </h1>

        {/* Body Description */}
        <p className="text-[16px] leading-[1.5] font-[400] text-[#424245] max-w-[560px] mb-6">
          Chọn phương Tây, phương Đông hoặc Ấn Độ, chụp một tấm ảnh và nhận bài bói trong chưa đầy một phút.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <Link
            to={isLogged ? BaseUrl.Scan : BaseUrl.Login}
            className="btn-primary"
          >
            Bắt đầu xem bói
          </Link>
          <a
            href="#vi-du-ket-qua"
            onClick={handleScrollToSample}
            className="btn-secondary"
          >
            Xem ví dụ kết quả
          </a>
        </div>

        {/* Caption */}
        <div className="text-[14px] leading-[2] font-[400] text-[#646262]">
          Đăng nhập bằng Google hoặc Facebook.
        </div>
      </div>

      {/* Hero TUI Mockup Box */}
      <div className="max-w-[1100px] mx-auto mt-12 bg-[#201d1d] rounded-none px-[32px] py-[64px] text-left">
        {/* Monospace ASCII wordmark in #fdfcfc */}
        <pre className="text-[15px] sm:text-[18px] md:text-[22px] leading-[1.05] text-[#fdfcfc] font-bold select-none overflow-x-auto whitespace-pre font-mono">
          {ASCII_WORDMARK}
        </pre>

        {/* Prompt box */}
        <div className="mt-[32px] bg-[#302c2c] rounded-[4px] px-[12px] py-[8px] text-[#fdfcfc] text-[16px] leading-[1.5] font-[400]">
          |  Phương Đông   Tay trái   [Bói toàn bộ]
        </div>

        {/* Keybinding hints at the bottom */}
        <div className="mt-8 text-[14px] leading-[1.5] text-[#9a9898] font-[400]">
          tab đổi trường phái    enter xem bói
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
