# ADR-0007: Frontend là SPA React + Vite; repo chia `frontend/` · `backend/` · `shared/`

- Trạng thái: Accepted
- Ngày: 2026-10-14
- Thay thế một phần [ADR-0005](0005-monorepo-nextjs-nestjs.md): phần web (Next.js) và cấu trúc thư mục. Các quyết định còn lại của ADR-0005 (NestJS, MongoDB + Mongoose, pnpm workspaces, không Redis) giữ nguyên.

## Bối cảnh

ADR-0005 chọn Next.js cho web. Khi bắt đầu code, team đã dựng `frontend/` từ một boilerplate React + Vite + Tailwind + shadcn/ui mà team quen dùng.

PalmSight không cần những thứ Next.js mạnh:

- Gần như mọi màn hình đều cần đăng nhập. Dữ liệu lấy từ API NestJS, không cần render phía server.
- Landing và các trang chính sách đơn giản, không cần SEO phức tạp.
- Next.js chỉ được dùng để rewrite `/api/v1/*` sang API. Việc này Vite dev server (khi dev) và Vercel (khi deploy) đều làm được.

## Quyết định

- **Web là SPA**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui, React Router, TanStack Query. Build ra file tĩnh (`frontend/dist`).
- **PWA** bằng `vite-plugin-pwa`: manifest, icon, service worker. Service worker **không** cache `/api/v1/*`.
- **Cấu trúc repo** (pnpm workspaces):

  | Thư mục | Tên package | Nội dung |
  | --- | --- | --- |
  | `frontend/` | `frontend` | SPA React + Vite |
  | `backend/` | `backend` | NestJS + Mongoose |
  | `shared/` | `@palmsight/shared` | Yup schema, enum, `READING_SCHOOLS`, `LIFE_ASPECTS`, DTO |

  `packages/shared` và `apps/api` trong các ADR cũ nay là `shared/` và `backend/`.
- `shared/` được build ra `dist/` (ESM + CJS + `.d.ts`) để cả Vite và NestJS (CommonJS) cùng import được. `pnpm dev` chạy `shared` ở chế độ watch.
- **Web và API vẫn chạy chung một domain**, để cookie `rt` là cookie first-party:
  - Dev: `server.proxy` của Vite chuyển `/api/v1/*` sang `http://localhost:4000`.
  - Prod: `frontend/vercel.json` rewrite `/api/v1/*` sang URL của API trên Render, các đường dẫn còn lại rewrite về `/index.html` (SPA fallback).
- Biến môi trường cho trình duyệt dùng tiền tố `VITE_`. Vite đọc file `.env` ở thư mục gốc repo (`envDir: '..'`).

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
| --- | --- |
| Giữ Next.js như ADR-0005 | Không dùng SSR hay server component; phải bỏ boilerplate đã dựng; thêm một lớp server không cần thiết |
| SPA gọi thẳng API trên domain của Render | Cookie `rt` thành cookie third-party, Safari và chế độ chặn cookie bên thứ ba sẽ chặn; phải cấu hình CORS có credentials |
| Giữ tên `apps/web`, `apps/api`, `packages/shared` | Code đã nằm ở `frontend/`; ba thư mục ở gốc đủ rõ cho repo nhỏ |

## Hệ quả

- **Không có SSR.** Link `/r/:code` khi chia sẻ lên mạng xã hội chỉ có thẻ Open Graph chung trong `index.html`, không cá nhân hoá được. Chấp nhận.
- **Các trang `/privacy`, `/terms`, `/data-deletion`** làm bằng HTML tĩnh trong `frontend/public/` (`privacy.html`…), bật `cleanUrls` trong `vercel.json`. Nhờ vậy, crawler của Facebook và Google đọc được nội dung mà không cần chạy JavaScript.
- Header bảo mật của web (CSP, HSTS…) khai báo trong `frontend/vercel.json`. Header của API do NestJS đặt.
- Giá trị `VITE_*` được nhúng vào bundle lúc build: lộ ra trình duyệt, và phải build lại khi đổi giá trị. Không bao giờ đặt secret vào biến `VITE_*`.
- URL API trên Render ghi thẳng trong `vercel.json`, vì Vercel không đọc biến môi trường trong rewrite. URL này không phải secret.
- Khi dev qua ngrok, phải thêm domain ngrok vào `server.allowedHosts` của Vite.
- Từ boilerplate:
  - **Giữ lại:** `components/ui` (shadcn), Tailwind, React Router, TanStack Query, axios, zustand, Formik + Yup. Yup cũng là thư viện validate của backend và `shared/`.
  - **Phải viết lại hoặc bỏ:**
    - đăng nhập giả (`don`/`don`) và token lưu `localStorage` → gọi API thật (email/username + mật khẩu, Google, Facebook theo [ADR-0008](0008-email-password-auth.md)), access token giữ trong bộ nhớ;
    - trang ForgotPassword, ChangePassword: giữ giao diện, viết lại logic theo API thật;
    - phân quyền theo role (`withCheckRole`, `PERMISSION_ENUM`);
    - tiếng Anh và bộ chọn ngôn ngữ;
    - layout sidebar → layout mobile với thanh tab dưới;
    - các trang mẫu (Todos, Examples).
