import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useState } from "react";
import { useAuth } from "@/providers/AuthenticationProvider";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
  const { logout, user } = useAuth();
  const [openPopover, setPopover] = useState(false);

  const displayName =
    user?.displayName ||
    (user?.firstname && user?.lastname
      ? `${user.firstname} ${user.lastname}`
      : user?.username || "Người dùng");
  const displayEmail = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase() || "P";

  return (
    <nav className="flex w-full items-center justify-between p-2 md:justify-end">
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-bold text-lg text-primary">PalmSight</span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Popover open={openPopover} onOpenChange={setPopover}>
          <PopoverTrigger asChild>
            <div className="navbar__avatar flex items-center gap-2 rounded-md hover:cursor-pointer">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="mb-1 text-sm font-medium leading-none">
                  {displayName}
                </p>
                {displayEmail && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="mr-2 mt-2 flex max-w-[200px] flex-col p-2">
            {[
              {
                label: "Đổi mật khẩu",
                href: BaseUrl.ChangePassword,
                function: () => {
                  setPopover(false);
                },
              },
              {
                label: "Đăng xuất",
                function: () => {
                  setPopover(false);
                  logout();
                },
              },
            ].map((f) => {
              if (f.href) {
                return (
                  <Link
                    to={f.href}
                    className="navbar__each__menu is-hover p-1 px-2 text-sm"
                    key={f.label}
                    onClick={f.function}
                  >
                    {f.label}
                  </Link>
                );
              }

              return (
                <p
                  onClick={f.function}
                  className="navbar__each__menu is-hover p-1 px-2 text-sm cursor-pointer"
                  key={f.label}
                >
                  {f.label}
                </p>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
