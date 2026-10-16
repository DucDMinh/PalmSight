import React, { useEffect, useState } from "react";

export const AnalyzingView: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      clearInterval(timer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div
      className="w-full max-w-[560px] mx-auto py-16 px-6 flex flex-col items-center justify-center text-center font-mono select-none"
      data-testid="analyzing-view"
    >
      <div className="w-16 h-16 border-2 border-hairline border-t-ink rounded-full animate-spin mb-8" />

      <div className="text-xs uppercase tracking-widest text-mute mb-2">
        SYS::ANALYZING_PALM // PID_{Math.min(9999, 1000 + seconds * 13)}
      </div>

      <h2 className="font-heading-lg text-heading-lg text-ink font-bold mb-3">
        Đang đọc đường chỉ tay{dots}
      </h2>

      <p className="font-body-md text-body-md text-mute max-w-[420px] mb-8 leading-relaxed">
        Vui lòng đợi trong giây lát (có thể mất tới 40 giây). Hệ thống đang phân tích chi tiết các đặc điểm lòng bàn tay của bạn.
      </p>

      {/* Terminal progress bar */}
      <div className="w-full bg-surface-card border border-hairline p-4 rounded text-left text-xs font-mono text-ink space-y-1.5 shadow-sm">
        <div className="flex justify-between text-mute">
          <span>TASK: NEURAL_VISION_DECODE</span>
          <span>{Math.min(45, seconds)}s / 45s</span>
        </div>
        <div className="w-full bg-surface-container h-2 rounded overflow-hidden">
          <div
            className="bg-ink h-full transition-all duration-1000"
            style={{ width: `${Math.min(95, Math.max(5, (seconds / 40) * 100))}%` }}
          />
        </div>
        <div className="text-ash text-[11px] pt-1">
          &gt; EXIF_STRIP: OK · AI_INFERENCE_START · PROCESSING_BLOCKS...
        </div>
      </div>
    </div>
  );
};

export default AnalyzingView;
