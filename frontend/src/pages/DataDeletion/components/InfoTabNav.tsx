import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import type { InfoTab } from "../types";

interface InfoTabNavProps {
  activeTab: InfoTab;
  onTabChange?: (tab: InfoTab) => void;
}

export const InfoTabNav = ({ activeTab, onTabChange }: InfoTabNavProps) => {
  return (
    <nav
      aria-label="Điều hướng chính sách"
      className="flex border-b border-hairline mb-8 gap-4 sm:gap-8 text-sm font-mono"
    >
      <Link
        to={BaseUrl.DataDeletion}
        onClick={() => onTabChange?.("deletion")}
        className={`pb-3 -mb-px transition-colors select-none ${
          activeTab === "deletion"
            ? "border-b-2 border-ink text-ink font-bold"
            : "text-mute hover:text-ink"
        }`}
      >
        Xoá dữ liệu
      </Link>
      <Link
        to={BaseUrl.Terms}
        onClick={() => onTabChange?.("terms")}
        className={`pb-3 -mb-px transition-colors select-none ${
          activeTab === "terms"
            ? "border-b-2 border-ink text-ink font-bold"
            : "text-mute hover:text-ink"
        }`}
      >
        Điều khoản
      </Link>
      <Link
        to={BaseUrl.Privacy}
        onClick={() => onTabChange?.("privacy")}
        className={`pb-3 -mb-px transition-colors select-none ${
          activeTab === "privacy"
            ? "border-b-2 border-ink text-ink font-bold"
            : "text-mute hover:text-ink"
        }`}
      >
        Chính sách riêng tư
      </Link>
    </nav>
  );
};

export default InfoTabNav;
