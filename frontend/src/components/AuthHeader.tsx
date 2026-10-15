import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";

interface AuthHeaderProps {
  rightAction?: "login" | "user" | "none";
}

export const AuthHeader = ({ rightAction = "login" }: AuthHeaderProps) => {
  const { isLogged, user } = useAuth();

  return (
    <header className="sticky top-0 left-0 right-0 z-50 h-14 bg-canvas border-b border-hairline flex items-center w-full">
      <div className="w-full max-w-[960px] mx-auto px-4 flex items-center justify-between">
        <Link
          to={BaseUrl.Homepage}
          aria-label="PALMSIGHT Home"
          className="flex items-center gap-2 select-none group"
        >
          {/* Block-pixel monospaced terminal wordmark */}
          <pre
            className="text-[8px] sm:text-[10px] leading-[1.05] font-bold text-ink font-mono whitespace-pre select-none tracking-normal"
            aria-label="PALMSIGHT"
          >
{`███ ███ █   █ █ ███ ███ ███ █ █ ███
█ █ █ █ █   ███ █    █  █   █ █  █
███ ███ █   ███ ███  █  █ █ ███  █
█   █ █ █   █ █   █  █  █ █ █ █  █
█   █ █ ███ █ █ ███ ███ ███ █ █  █`}
          </pre>
        </Link>

        {rightAction === "login" && !isLogged && (
          <Link
            to={BaseUrl.Login}
            className="text-base font-medium text-ink underline underline-offset-4 hover:text-charcoal transition-colors"
          >
            Đăng nhập
          </Link>
        )}

        {isLogged && (
          <div className="flex items-center gap-3">
            <span
              data-testid="credit-balance-badge"
              className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-hairline bg-surface-card text-ink"
            >
              [{user?.creditBalance ?? 0} CREDITS]
            </span>
            <div className="w-7 h-7 rounded-full bg-ink text-canvas flex items-center justify-center font-mono text-xs font-bold">
              {(user?.displayName || user?.username || "P").charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AuthHeader;
