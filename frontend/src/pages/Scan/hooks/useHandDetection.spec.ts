import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandOrientation } from "@palmsight/shared";
import { useHandDetection } from "./useHandDetection";

describe("useHandDetection hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with IDLE status and default options", () => {
    const videoRef = { current: null };
    const onCapture = vi.fn();

    const { result } = renderHook(() =>
      useHandDetection({
        videoRef,
        isCameraActive: false,
        targetHand: HandOrientation.LEFT,
        onCapture,
      })
    );

    expect(result.current.status).toBe("IDLE");
    expect(result.current.feedback).toBe("Bật camera để nhận diện");
    expect(result.current.progress).toBe(0);
    expect(result.current.isAutoCaptureEnabled).toBe(true);
    expect(result.current.isModelReady).toBe(false);
  });

  it("should allow toggling auto capture state", () => {
    const videoRef = { current: null };
    const onCapture = vi.fn();

    const { result } = renderHook(() =>
      useHandDetection({
        videoRef,
        isCameraActive: false,
        targetHand: HandOrientation.RIGHT,
        onCapture,
        enabled: true,
      })
    );

    expect(result.current.isAutoCaptureEnabled).toBe(true);

    act(() => {
      result.current.setIsAutoCaptureEnabled(false);
    });

    expect(result.current.isAutoCaptureEnabled).toBe(false);
  });

  it("should reset status and progress when camera becomes inactive", () => {
    const videoRef = { current: null };
    const onCapture = vi.fn();

    const { result, rerender } = renderHook(
      ({ isActive }) =>
        useHandDetection({
          videoRef,
          isCameraActive: isActive,
          targetHand: HandOrientation.LEFT,
          onCapture,
        }),
      { initialProps: { isActive: true } }
    );

    rerender({ isActive: false });

    expect(result.current.status).toBe("IDLE");
    expect(result.current.progress).toBe(0);
  });
});
