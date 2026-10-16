import { useState, useEffect, useRef } from "react";
import PageWrapper from "@/components/PageWrapper";
import useMeQuery from "./hooks/useMeQuery";
import ProfileSection from "./components/ProfileSection";
import SecuritySection from "./components/SecuritySection";
import EnterReferralSection from "./components/EnterReferralSection";
import WalletSection from "./components/WalletSection";
import ReferralSection from "./components/ReferralSection";
import type { UserDto } from "./types";

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: "ho-so", label: "Hồ sơ" },
  { id: "bao-mat", label: "Bảo mật" },
  { id: "nhap-ma", label: "Nhập mã" },
  { id: "vi-credits", label: "Ví credits" },
  { id: "gioi-thieu", label: "Giới thiệu" },
];

export const Account = () => {
  const { data: meData, isLoading } = useMeQuery();
  const user = (meData || null) as UserDto | null;
  const [activeSection, setActiveSection] = useState<string>("ho-so");
  const isManualScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialHash = window.location.hash.replace("#", "");
    if (NAV_ITEMS.some((item) => item.id === initialHash)) {
      setActiveSection(initialHash);
    }

    const handleScroll = () => {
      if (isManualScrollRef.current) return;

      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 60;

      if (isAtBottom) {
        setActiveSection(NAV_ITEMS[NAV_ITEMS.length - 1].id);
        return;
      }

      const scrollPos = window.scrollY + 120;
      let current = "";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollPos) {
          current = item.id;
        }
      }
      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleNavClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    isManualScrollRef.current = true;
    setActiveSection(id);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 800);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView?.({ behavior: "smooth" });
      }
    }
  };

  return (
    <PageWrapper>
      <div className="component:Account w-full max-w-[960px] mx-auto pt-8 md:pt-12 pb-36 md:pb-48 px-4 font-mono text-ink">
        <div className="flex flex-col md:flex-row items-start">
          {/* LEFT SUB-MENU: Sticky on desktop */}
          <aside className="w-full md:w-[200px] shrink-0 md:sticky md:top-20 self-start mb-8 md:mb-0">
            <nav
              id="sub-nav"
              aria-label="Sub navigation"
              className="flex flex-row md:flex-col gap-4 md:gap-0 text-sm overflow-x-auto pb-2 md:pb-0"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <div key={item.id} className="py-1.5 md:py-2 shrink-0">
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleNavClick(item.id, e)}
                      data-testid={`sub-nav-${item.id}`}
                      aria-current={isActive ? "true" : undefined}
                      className={`sub-nav-link inline-block transition-all cursor-pointer select-none ${
                        isActive
                          ? "font-bold text-ink border-b-2 border-ink"
                          : "text-mute hover:text-ink border-b-2 border-transparent"
                      }`}
                    >
                      {item.label}
                    </a>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* 1px vertical hairline rule on desktop */}
          <div
            aria-hidden="true"
            className="hidden md:block w-px bg-hairline self-stretch shrink-0 mx-8"
          />

          {/* RIGHT CONTENT COLUMN */}
          <div className="w-full md:max-w-[680px] shrink-0 flex flex-col">
            {isLoading && !user ? (
              <div className="p-8 text-center text-sm text-mute">
                Đang tải thông tin tài khoản...
              </div>
            ) : (
              <>
                <ProfileSection user={user} />
                <SecuritySection user={user} />
                <EnterReferralSection user={user} />
                <WalletSection user={user} />
                <ReferralSection user={user} />
              </>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Account;
