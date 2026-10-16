import React from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";

const Page404 = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center font-mono text-ink">
      <h1 className="text-6xl sm:text-7xl font-bold leading-tight mb-2">404</h1>
      <span className="font-bold text-lg mb-2">Oops! Không tìm thấy trang</span>
      <p className="text-center text-mute max-w-md text-sm mb-6">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to={BaseUrl.Homepage}
        className="inline-flex h-9 items-center justify-center rounded border border-hairline bg-surface-dark px-4 py-2 text-sm font-medium text-on-dark transition-opacity hover:opacity-90"
      >
        Về trang chủ
      </Link>
    </div>
  );
};

export default React.memo(Page404);
