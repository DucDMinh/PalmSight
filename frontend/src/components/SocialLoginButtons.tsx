export const SocialLoginButtons = () => {
  return (
    <>
      <div className="relative text-center my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-canvas px-4 text-sm text-mute">hoặc</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="w-full h-9 bg-canvas text-ink border border-hairline-strong rounded font-medium text-base px-5 flex items-center justify-center hover:bg-surface-card transition-colors cursor-pointer"
        >
          <span className="font-bold mr-2">[G]</span> Đăng nhập bằng Google
        </button>
        <button
          type="button"
          className="w-full h-9 bg-canvas text-ink border border-hairline-strong rounded font-medium text-base px-5 flex items-center justify-center hover:bg-surface-card transition-colors cursor-pointer"
        >
          <span className="font-bold mr-2">[f]</span> Đăng nhập bằng Facebook
        </button>
      </div>
    </>
  );
};

export default SocialLoginButtons;
