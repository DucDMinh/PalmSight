import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ASCII_WORDMARK = `███ ███ █   █ █ ███ ███ ███ █ █ ███
█ █ █ █ █   ███ █    █  █   █ █  █
███ ███ █   ███ ███  █  █ █ ███  █
█   █ █ █   █ █   █  █  █ █ █ █  █
█   █ █ ███ █ █ ███ ███ ███ █ █  █`;

interface NavbarProps {
  rightAction?: "login" | "user" | "none";
}

export default function Navbar({ rightAction }: NavbarProps) {
  const { isLogged, user, logout } = useAuth();
  const location = useLocation();
  const [openPopover, setPopover] = useState(false);

  const isLoginPage = location.pathname === BaseUrl.Login;

  return (
    <header className="sticky top-0 left-0 right-0 z-50 min-h-[72px] py-3.5 sm:py-4 bg-canvas border-b border-hairline flex items-center w-full font-mono text-ink">
      <div className="w-full max-w-[92%] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Wordmark & Navigation */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            to={BaseUrl.Homepage}
            aria-label="PALMSIGHT Home"
            className="flex items-center select-none group py-0.5"
          >
            <pre
              className="text-[7px] sm:text-[9px] md:text-[10px] leading-[1.05] font-bold text-ink font-mono whitespace-pre select-none tracking-normal"
              aria-label="PALMSIGHT"
            >
              {ASCII_WORDMARK}
            </pre>
          </Link>

          {isLogged ? (
            <nav className="hidden sm:flex items-center gap-4 md:gap-6 text-sm">
              <Link
                to={BaseUrl.Scan}
                className={`py-1.5 inline-flex items-center transition-colors border-b-2 ${
                  location.pathname === BaseUrl.Scan
                    ? "text-ink border-ash font-bold"
                    : "text-mute hover:text-ink border-transparent"
                }`}
              >
                Xem bói
              </Link>
              <Link
                to={BaseUrl.Readings}
                className={`py-1.5 inline-flex items-center transition-colors border-b-2 ${
                  location.pathname === BaseUrl.Readings ||
                  location.pathname.startsWith("/readings")
                    ? "text-ink border-ash font-bold"
                    : "text-mute hover:text-ink border-transparent"
                }`}
              >
                Lịch sử
              </Link>
              <Link
                to={BaseUrl.Account}
                className={`py-1.5 inline-flex items-center transition-colors border-b-2 ${
                  location.pathname === BaseUrl.Account ||
                  location.pathname === BaseUrl.ChangePassword
                    ? "text-ink border-ash font-bold"
                    : "text-mute hover:text-ink border-transparent"
                }`}
              >
                Tài khoản
              </Link>
            </nav>
          ) : (
            location.pathname === BaseUrl.Homepage && (
              <nav className="hidden sm:flex items-center gap-6 text-[16px] font-[500] text-[#201d1d]">
                <a
                  href="#cach-hoat-dong"
                  className="hover:underline text-[#201d1d] no-underline py-1 transition-colors"
                >
                  Cách hoạt động
                </a>
                <a
                  href="#truong-phai"
                  className="hover:underline text-[#201d1d] no-underline py-1 transition-colors"
                >
                  Trường phái
                </a>
                <a
                  href="#hoi-dap"
                  className="hover:underline text-[#201d1d] no-underline py-1 transition-colors"
                >
                  Hỏi đáp
                </a>
              </nav>
            )
          )}
        </div>

        {/* Right Section */}
        {rightAction !== "none" && (
          <div className="flex items-center gap-3">
            {isLogged ? (
              <>
                <Link
                  to={BaseUrl.Wallet}
                  data-testid="credit-balance-badge"
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-hairline bg-surface-card text-ink hover:opacity-80 transition-opacity"
                >
                  [{user?.creditBalance ?? 0} CREDITS]
                </Link>

                <Popover open={openPopover} onOpenChange={setPopover}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="User menu"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-ink text-canvas flex items-center justify-center font-mono text-xs font-bold hover:opacity-80 transition-opacity cursor-pointer select-none"
                    >
                      {(user?.displayName || user?.username || "P")
                        .charAt(0)
                        .toUpperCase()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-48 p-1 bg-canvas border border-hairline shadow-md text-ink font-mono text-sm rounded-none"
                  >
                    <div className="px-3 py-2 border-b border-hairline text-xs text-mute truncate">
                      {user?.displayName || user?.username || "Người dùng"}
                    </div>
                    <Link
                      to={BaseUrl.Account}
                      onClick={() => setPopover(false)}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-surface-card transition-colors text-ink"
                    >
                      Tài khoản
                    </Link>
                    <Link
                      to={BaseUrl.Wallet}
                      onClick={() => setPopover(false)}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-surface-card transition-colors text-ink"
                    >
                      Ví credits
                    </Link>
                    <Link
                      to={BaseUrl.Referral}
                      onClick={() => setPopover(false)}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-surface-card transition-colors text-ink"
                    >
                      Giới thiệu bạn bè
                    </Link>
                    <Link
                      to={BaseUrl.ChangePassword}
                      onClick={() => setPopover(false)}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-surface-card transition-colors text-ink"
                    >
                      Đổi mật khẩu
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setPopover(false);
                        logout();
                      }}
                      className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-surface-card transition-colors text-ink cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </PopoverContent>
                </Popover>
              </>
            ) : isLoginPage ? (
              <Link
                to={BaseUrl.Register}
                className="text-base font-medium text-ink underline underline-offset-4 hover:text-charcoal transition-colors"
              >
                Đăng ký
              </Link>
            ) : location.pathname === BaseUrl.Homepage ? (
              <Link
                to={BaseUrl.Login}
                className="btn-primary"
              >
                Bắt đầu
              </Link>
            ) : (
              <Link
                to={BaseUrl.Login}
                className="text-base font-medium text-ink underline underline-offset-4 hover:text-charcoal transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
