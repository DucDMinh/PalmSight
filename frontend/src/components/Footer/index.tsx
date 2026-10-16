import BaseUrl from "@/consts/baseUrl";

const Footer = () => {
  return (
    <footer className="w-full bg-canvas border-t border-hairline py-8 sm:py-10 mt-auto font-mono text-ink">
      <div className="w-full max-w-[92%] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-mute">
        <p>Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn.</p>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <a
            href={BaseUrl.Privacy}
            className="text-mute hover:text-ink underline transition-colors"
          >
            Chính sách riêng tư
          </a>
          <a
            href={BaseUrl.Terms}
            className="text-mute hover:text-ink underline transition-colors"
          >
            Điều khoản
          </a>
          <a
            href={BaseUrl.DataDeletion}
            className="text-mute hover:text-ink underline transition-colors"
          >
            Xoá dữ liệu
          </a>
        </div>
        <p className="shrink-0">© PALMSIGHT</p>
      </div>
    </footer>
  );
};

export default Footer;
