import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { useAuth } from "@/providers/AuthenticationProvider";
import { ReadingSchool, HandOrientation, READING_SCHOOLS } from "@palmsight/shared";
import { ScanStatus } from "../types";

interface CaptureStepProps {
  school: ReadingSchool;
  hand: HandOrientation;
  isAllTopics: boolean;
  selectedCount: number;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  aiConsent: boolean;
  onConsentChange: (consent: boolean) => void;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  onSubmit: () => void;
  onRetry: () => void;
  status: ScanStatus;
  errorMessage?: string | null;
  rejectReason?: string | null;
}

export const CaptureStep: React.FC<CaptureStepProps> = ({
  school,
  hand,
  isAllTopics,
  selectedCount,
  imageFile,
  imagePreviewUrl,
  aiConsent,
  onConsentChange,
  onImageChange,
  onSubmit,
  onRetry,
  status,
  errorMessage,
  rejectReason,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const schoolConfig = READING_SCHOOLS[school];
  const handLabel = hand === HandOrientation.LEFT ? "Tay trái" : "Tay phải";
  const topicsSummary = isAllTopics ? "Toàn bộ" : `${selectedCount} mục`;

  const creditBalance = user?.creditBalance ?? 0;
  const isOutOfCredits = creditBalance <= 0;
  const canEnterCode = Boolean(user?.referral?.canEnterCode);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError("Trình duyệt không hỗ trợ camera. Vui lòng chọn ảnh có sẵn.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError("Không thể truy cập camera. Vui lòng cấp quyền hoặc chọn ảnh có sẵn.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "palm.jpg", { type: "image/jpeg" });
        const preview = typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : "";
        stopCamera();
        onImageChange(file, preview);
      },
      "image/jpeg",
      0.92
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const preview = typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "";
    onImageChange(file, preview);
  };

  const handleRetake = () => {
    if (imagePreviewUrl && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSubmit =
    Boolean(imageFile) &&
    aiConsent &&
    !isOutOfCredits &&
    selectedCount > 0 &&
    status !== "ANALYZING";

  return (
    <section className="w-full md:w-[520px] shrink-0 flex flex-col justify-start">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
        <div className="flex items-center gap-3">
          <h2 className="font-heading-md text-heading-md text-ink m-0 font-bold">
            4. Chụp ảnh
          </h2>
          <span className="font-code-sm text-code-sm text-success inline-flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
            {imageFile ? "IMAGE_LOADED" : isCameraActive ? "CAMERA_ACTIVE" : "READY"}
          </span>
        </div>
        <span className="font-code-sm text-code-sm text-mute font-mono">INPUT::DEV_0</span>
      </div>

      {/* Summary Selection */}
      <div className="font-body-sm text-body-sm text-mute mb-4 select-none" data-testid="selection-summary">
        {schoolConfig.name.replace("Chỉ tay ", "")} · {handLabel} · {topicsSummary}
      </div>

      {/* Viewfinder Box */}
      <div
        className="relative w-full h-[360px] sm:h-[390px] bg-surface-dark overflow-hidden flex items-center justify-center select-none rounded-[4px]"
        id="viewfinder"
        data-testid="viewfinder"
      >
        {/* ASCII Corner Brackets */}
        <div className="absolute top-4 left-4 font-mono text-xl text-on-dark leading-none pointer-events-none select-none">
          ┌
        </div>
        <div className="absolute top-4 right-4 font-mono text-xl text-on-dark leading-none pointer-events-none select-none">
          ┐
        </div>
        <div className="absolute bottom-4 left-4 font-mono text-xl text-on-dark leading-none pointer-events-none select-none">
          └
        </div>
        <div className="absolute bottom-4 right-4 font-mono text-xl text-on-dark leading-none pointer-events-none select-none">
          ┘
        </div>

        {/* Framing Guides */}
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none select-none">
          <span className="font-code-sm text-code-sm text-ash tracking-widest text-[10px] font-mono">
            SCAN AREA // 1080P
          </span>
        </div>

        {/* Live Video */}
        {isCameraActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="camera-video"
          />
        )}

        {/* Image Preview */}
        {imagePreviewUrl && (
          <img
            src={imagePreviewUrl}
            alt="Palm preview"
            className="absolute inset-0 w-full h-full object-contain bg-surface-dark"
            data-testid="image-preview"
          />
        )}

        {/* Minimal Palm Silhouette Wireframe when no image */}
        {!imagePreviewUrl && (
          <svg
            className="w-[180px] h-[240px] pointer-events-none relative z-10"
            fill="none"
            viewBox="0 0 180 240"
            xmlns="http://www.w3.org/2000/svg"
            data-testid="palm-wireframe"
          >
            <path
              d="M 46 175
                 C 38 160 22 135 15 120
                 C 10 110 14 100 24 104
                 C 35 109 50 128 58 136
                 C 57 115 54 62 55 45
                 C 56 36 67 36 68 45
                 C 70 60 72 100 73 108
                 C 74 90 75 32 78 18
                 C 80 8 91 8 92 18
                 C 94 36 94 92 95 108
                 C 98 90 102 44 106 32
                 C 108 24 119 25 120 34
                 C 122 55 120 102 120 118
                 C 124 106 131 75 137 68
                 C 142 62 152 66 150 76
                 C 145 98 138 140 137 165
                 C 135 195 126 230 118 238
                 L 60 238
                 C 52 230 48 200 46 175 Z"
              stroke="#9a9898"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M 85 155 L 95 155 M 90 150 L 90 160"
              stroke="#9a9898"
              strokeWidth="1"
            />
          </svg>
        )}

        {/* Telemetry overlay status bar */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between items-center pointer-events-none select-none font-mono z-10">
          <span className="font-code-sm text-code-sm text-ash text-[10px]">
            FPS: 30.0
          </span>
          <span className="font-code-sm text-code-sm text-ash text-[10px]">
            ALIGN_CENTER
          </span>
          <span className="font-code-sm text-code-sm text-ash text-[10px]">
            ISO_AUTO
          </span>
        </div>
      </div>

      {/* Hint under viewfinder */}
      <p className="font-body-md text-body-md text-body mt-4 mb-4 leading-relaxed">
        Đủ sáng, xoè tay, lòng bàn tay hướng vào camera.
      </p>

      {cameraError && (
        <p className="text-danger font-body-sm text-sm mb-4" data-testid="camera-error">
          [!] {cameraError}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        data-testid="file-input"
      />

      {/* Buttons row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {imageFile ? (
          <button
            type="button"
            onClick={handleRetake}
            className="h-9 px-5 bg-canvas text-ink border border-hairline-strong font-button-md text-sm rounded hover:bg-surface-soft transition-colors flex items-center justify-center cursor-pointer"
            data-testid="retake-button"
          >
            Chụp lại / Chọn lại
          </button>
        ) : isCameraActive ? (
          <>
            <button
              type="button"
              onClick={capturePhoto}
              className="h-9 px-5 bg-ink text-on-dark font-button-md text-sm rounded hover:bg-charcoal transition-colors flex items-center justify-center cursor-pointer"
              data-testid="shutter-button"
            >
              Chụp ảnh
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="h-9 px-5 bg-canvas text-ink border border-hairline-strong font-button-md text-sm rounded hover:bg-surface-soft transition-colors flex items-center justify-center cursor-pointer"
            >
              Đóng camera
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startCamera}
              className="h-9 px-5 bg-ink text-on-dark font-button-md text-sm rounded hover:bg-charcoal transition-colors flex items-center justify-center cursor-pointer"
              data-testid="open-camera-button"
            >
              Bật camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-5 bg-canvas text-ink border border-hairline-strong font-button-md text-sm rounded hover:bg-surface-soft transition-colors flex items-center justify-center cursor-pointer"
              data-testid="upload-button"
            >
              Chọn ảnh có sẵn
            </button>
          </>
        )}
      </div>

      {/* Checkbox consent */}
      <div className="mb-6">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={aiConsent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-1 accent-ink"
            data-testid="ai-consent-checkbox"
          />
          <span className="font-body-sm text-body-sm text-ink leading-relaxed">
            Tôi đồng ý gửi ảnh lòng bàn tay cho hệ thống AI phân tích
          </span>
        </label>
      </div>

      {/* Error & Credit warning banners */}
      {isOutOfCredits && (
        <div
          className="mb-6 p-4 border border-warning/50 bg-surface-card rounded text-sm text-ink space-y-2"
          data-testid="insufficient-credits-banner"
        >
          <div className="font-bold flex items-center gap-1.5 text-warning">
            <span>[!]</span>
            <span>Hết credits</span>
          </div>
          <p className="m-0 text-mute">
            Mời bạn bè nhập mã để nhận 2 credits:{" "}
            <Link
              to={BaseUrl.Referral}
              className="text-ink underline hover:text-charcoal font-medium"
            >
              Trang giới thiệu
            </Link>
          </p>
          {canEnterCode && (
            <p className="m-0 text-mute">
              Có mã của bạn bè?{" "}
              <Link
                to={BaseUrl.ReferralEnter}
                className="text-ink underline hover:text-charcoal font-medium"
              >
                Nhập để nhận 1 credit
              </Link>
            </p>
          )}
        </div>
      )}

      {status === "REJECTED" && (
        <div
          className="mb-6 p-4 border border-danger/40 bg-error-container/20 rounded text-sm text-ink space-y-2"
          data-testid="rejected-banner"
        >
          <div className="font-bold text-danger flex items-center gap-1">
            <span>[!] Không nhìn rõ lòng bàn tay</span>
          </div>
          <p className="m-0 text-mute">{rejectReason || "Hãy chụp lại nơi đủ sáng, xoè thẳng bàn tay."}</p>
          <p className="m-0 text-success text-xs font-mono">[+] Đã hoàn 1 credit</p>
          <button
            type="button"
            onClick={handleRetake}
            className="mt-2 text-xs font-mono underline text-ink hover:text-charcoal cursor-pointer"
          >
            &gt; Chụp lại ảnh
          </button>
        </div>
      )}

      {status === "AI_UNAVAILABLE" && (
        <div
          className="mb-6 p-4 border border-warning/50 bg-surface-card rounded text-sm text-ink space-y-2"
          data-testid="ai-unavailable-banner"
        >
          <div className="font-bold text-ink">
            [!] Hệ thống bận, đã hoàn 1 credit. Thử lại sau ít phút.
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-xs font-mono underline text-ink hover:text-charcoal cursor-pointer"
            data-testid="retry-ai-button"
          >
            &gt; Thử lại lần xem mới
          </button>
        </div>
      )}

      {status === "NETWORK_ERROR" && (
        <div
          className="mb-6 p-4 border border-danger/40 bg-error-container/20 rounded text-sm text-ink space-y-2"
          data-testid="network-error-banner"
        >
          <div className="font-bold text-danger">
            [!] Mất kết nối hoặc quá thời gian chờ.
          </div>
          {errorMessage && <p className="m-0 text-mute text-xs">{errorMessage}</p>}
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-xs font-mono underline text-ink hover:text-charcoal cursor-pointer"
            data-testid="retry-network-button"
          >
            &gt; Thử lại (cùng mã yêu cầu)
          </button>
        </div>
      )}

      {/* Submit button */}
      <div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={`w-full py-2.5 px-4 font-button-md text-button-md rounded transition-all text-center flex items-center justify-center font-mono ${
            canSubmit
              ? "bg-ink text-on-dark hover:bg-charcoal cursor-pointer shadow-sm active:scale-[0.99]"
              : "bg-surface-card text-mute border border-hairline cursor-not-allowed opacity-60"
          }`}
          data-testid="submit-reading-button"
        >
          Xem bói (−1 credit)
        </button>
      </div>
    </section>
  );
};

export default CaptureStep;
