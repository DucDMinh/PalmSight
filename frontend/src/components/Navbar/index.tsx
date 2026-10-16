import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ASCII_WORDMARK = `███ ███ █   █ █ ███ ███ ███ █ █ ███
█ █ █ █ █   ███ █    █  █   █ █  █
███ ███ █   ███ ███  █  █ █ ███  █
█   █ █ █   █ █   █  █  █ █ █ █  █
█   █ █ ███ █ █ ███ ███ ███ █ █  █`;

interface NavbarProps {
  rightAction?: "login" | "user" | "none";
}

export default function Navbar({ rightAction }: NavbarProps) {
  const { isLogged, user, logout, loading } = useAuth();
  const location = useLocation();
  const [openPopover, setPopover] = useState(false);

  const isLoginPage = location.pathname === BaseUrl.Login;

  return (
    <header className="sticky left-0 right-0 top-0 z-50 flex min-h-[72px] w-full items-center border-b border-hairline bg-canvas py-3.5 font-mono text-ink sm:py-4">
      <div className="mx-auto flex w-full max-w-[92%] items-center justify-between px-4 sm:px-6 2xl:max-w-[1536px]">
        {/* Left: Wordmark & Navigation */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            to={BaseUrl.Homepage}
            aria-label="PALMSIGHT Home"
            className="group flex select-none items-center py-0.5"
          >
            <pre
              className="select-none whitespace-pre font-mono text-[7px] font-bold leading-[1.05] tracking-normal text-ink sm:text-[9px] md:text-[10px]"
              aria-label="PALMSIGHT"
            >
              {ASCII_WORDMARK}
            </pre>
          </Link>

          {isLogged ? (
            <nav className="hidden items-center gap-4 text-sm sm:flex md:gap-6">
              <Link
                to={BaseUrl.Scan}
                className={`inline-flex items-center border-b-2 py-1.5 transition-colors ${
                  location.pathname === BaseUrl.Scan
                    ? "border-ash font-bold text-ink"
                    : "border-transparent text-mute hover:text-ink"
                }`}
              >
                Xem bói
              </Link>
              <Link
                to={BaseUrl.Readings}
                className={`inline-flex items-center border-b-2 py-1.5 transition-colors ${
                  location.pathname === BaseUrl.Readings ||
                  location.pathname.startsWith("/readings")
                    ? "border-ash font-bold text-ink"
                    : "border-transparent text-mute hover:text-ink"
                }`}
              >
                Lịch sử
              </Link>
              <Link
                to={BaseUrl.Account}
                className={`inline-flex items-center border-b-2 py-1.5 transition-colors ${
                  location.pathname === BaseUrl.Account ||
                  location.pathname === BaseUrl.ChangePassword
                    ? "border-ash font-bold text-ink"
                    : "border-transparent text-mute hover:text-ink"
                }`}
              >
                Tài khoản
              </Link>
            </nav>
          ) : (
            location.pathname === BaseUrl.Homepage && (
              <nav className="hidden items-center gap-6 text-[16px] font-[500] text-[#201d1d] sm:flex">
                <a
                  href="#cach-hoat-dong"
                  className="py-1 text-[#201d1d] no-underline transition-colors hover:underline"
                >
                  Cách hoạt động
                </a>
                <a
                  href="#truong-phai"
                  className="py-1 text-[#201d1d] no-underline transition-colors hover:underline"
                >
                  Trường phái
                </a>
                <a
                  href="#hoi-dap"
                  className="py-1 text-[#201d1d] no-underline transition-colors hover:underline"
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
                  className="rounded border border-hairline bg-surface-card px-2 py-0.5 font-mono text-xs font-bold text-ink transition-opacity hover:opacity-80"
                >
                  [{user?.creditBalance ?? 0} CREDITS]
                </Link>

                <Popover open={openPopover} onOpenChange={setPopover}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="User menu"
                      className="flex h-7 w-7 cursor-pointer select-none items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-canvas transition-opacity hover:opacity-80 sm:h-8 sm:w-8"
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (user?.displayName || user?.username || "P")
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-48 rounded-none border border-hairline bg-canvas p-1 font-mono text-sm text-ink shadow-md"
                  >
                    <div className="truncate border-b border-hairline px-3 py-2 text-xs text-mute">
                      {user?.displayName || user?.username || "Người dùng"}
                    </div>
                    <Link
                      to={BaseUrl.Account}
                      onClick={() => setPopover(false)}
                      className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-card"
                    >
                      Tài khoản
                    </Link>
                    <Link
                      to={BaseUrl.Wallet}
                      onClick={() => setPopover(false)}
                      className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-card"
                    >
                      Ví credits
                    </Link>
                    <Link
                      to={BaseUrl.Referral}
                      onClick={() => setPopover(false)}
                      className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-card"
                    >
                      Giới thiệu bạn bè
                    </Link>
                    <Link
                      to={BaseUrl.ChangePassword}
                      onClick={() => setPopover(false)}
                      className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-card"
                    >
                      Đổi mật khẩu
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setPopover(false);
                        logout();
                      }}
                      className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-card"
                    >
                      Đăng xuất
                    </button>
                  </PopoverContent>
                </Popover>
              </>
            ) : loading && !user ? (
              <div className="h-8 w-16" aria-hidden="true" />
            ) : isLoginPage ? (
              <Link
                to={BaseUrl.Register}
                className="text-base font-medium text-ink underline underline-offset-4 transition-colors hover:text-charcoal"
              >
                Đăng ký
              </Link>
            ) : location.pathname === BaseUrl.Homepage ? (
              <Link to={BaseUrl.Login} className="btn-primary">
                Bắt đầu
              </Link>
            ) : (
              <Link
                to={BaseUrl.Login}
                className="text-base font-medium text-ink underline underline-offset-4 transition-colors hover:text-charcoal"
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
