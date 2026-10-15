export const VerifyLoadingView = () => {
  return (
    <div data-testid="verify-loading" className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-2 text-ink text-lg font-bold">
        <span className="animate-spin">[~]</span>
        <span>Đang xác thực email và kích hoạt tài khoản...</span>
      </div>
      <p className="text-sm text-mute">Vui lòng chờ trong giây lát.</p>
    </div>
  );
};

export default VerifyLoadingView;
