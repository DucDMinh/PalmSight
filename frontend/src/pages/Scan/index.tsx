import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  ReadingSchool,
  HandOrientation,
  ReadingStatus,
  READING_SCHOOLS,
  LIFE_ASPECTS,
  ReadingDto,
} from "@palmsight/shared";
import { useAuth } from "@/providers/AuthenticationProvider";
import { TarotCorners } from "@/components/mystic/MysticDivider";
import SchoolStep from "./components/SchoolStep";
import TopicsStep from "./components/TopicsStep";
import HandStep from "./components/HandStep";
import CaptureStep from "./components/CaptureStep";
import AnalyzingView from "./components/AnalyzingView";
import useCreateReadingMutation from "./hooks/useCreateReadingMutation";
import useReadingPoll from "./hooks/useReadingPoll";
import { ScanStatus } from "./types";

const LAST_SCHOOL_STORAGE_KEY = "palmsight_last_school";

export const Scan: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [school, setSchool] = useState<ReadingSchool>(() => {
    try {
      const saved = localStorage.getItem(LAST_SCHOOL_STORAGE_KEY);
      if (
        saved &&
        (saved === ReadingSchool.WESTERN ||
          saved === ReadingSchool.EASTERN ||
          saved === ReadingSchool.VEDIC)
      ) {
        return saved as ReadingSchool;
      }
    } catch {
    }
    return ReadingSchool.EASTERN;
  });

  const [isAllTopics, setIsAllTopics] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>(() =>
    READING_SCHOOLS[ReadingSchool.EASTERN].sections.map((s) => s.key)
  );
  const [selectedAspects, setSelectedAspects] = useState<string[]>(() =>
    LIFE_ASPECTS.map((a) => a.key)
  );

  const [hand, setHand] = useState<HandOrientation>(HandOrientation.LEFT);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(false);

  const [status, setStatus] = useState<ScanStatus>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [pollingReadingId, setPollingReadingId] = useState<string | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);

  const { mutateAsync: createReading } = useCreateReadingMutation();

  const handleSelectSchool = useCallback((newSchool: ReadingSchool) => {
    setSchool(newSchool);
    try {
      localStorage.setItem(LAST_SCHOOL_STORAGE_KEY, newSchool);
    } catch {
    }
    const nextSections = READING_SCHOOLS[newSchool].sections.map((s) => s.key);
    setSelectedSections(nextSections);
  }, []);

  const handleTopicsChange = useCallback(
    (isAll: boolean, sections: string[], aspects: string[]) => {
      setIsAllTopics(isAll);
      setSelectedSections(sections);
      setSelectedAspects(aspects);
    },
    []
  );

  const handleImageChange = useCallback(
    (file: File | null, preview: string | null) => {
      setImageFile(file);
      setImagePreviewUrl(preview);
      if (!file) {
        setStatus("IDLE");
        setRejectReason(null);
        setErrorMessage(null);
        idempotencyKeyRef.current = null;
      }
    },
    []
  );

  const selectedCount = isAllTopics
    ? READING_SCHOOLS[school].sections.length + LIFE_ASPECTS.length
    : selectedSections.length + selectedAspects.length;

  const handlePollFinished = useCallback(
    (reading: ReadingDto) => {
      setPollingReadingId(null);
      if (reading.status === ReadingStatus.DONE) {
        setStatus("IDLE");
        navigate(`/readings/${reading.id}`);
      } else if (reading.status === ReadingStatus.REJECTED) {
        setStatus("REJECTED");
        setRejectReason(reading.rejectReason);
      } else if (reading.status === ReadingStatus.FAILED) {
        setStatus("AI_UNAVAILABLE");
      }
    },
    [navigate]
  );

  const handlePollError = useCallback(() => {
    setPollingReadingId(null);
    setStatus("NETWORK_ERROR");
    setErrorMessage("Không thể kiểm tra trạng thái lần xem bói.");
  }, []);

  useReadingPoll({
    readingId: pollingReadingId,
    onFinished: handlePollFinished,
    onError: handlePollError,
    enabled: Boolean(pollingReadingId),
  });

  const doSubmit = useCallback(
    async (reuseKey = false) => {
      if (!imageFile) return;

      if (!reuseKey || !idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      const key = idempotencyKeyRef.current;

      setStatus("ANALYZING");
      setErrorMessage(null);
      setRejectReason(null);

      const topicsParam = isAllTopics
        ? undefined
        : [...selectedSections, ...selectedAspects];

      try {
        const response = await createReading({
          school,
          hand,
          topics: topicsParam,
          aiConsent,
          image: imageFile,
          idempotencyKey: key,
        });

        if (response.creditBalance !== undefined) {
          updateUser({ creditBalance: response.creditBalance });
        }

        if (response.reading.status === ReadingStatus.DONE) {
          setStatus("IDLE");
          navigate(`/readings/${response.reading.id}`);
        } else if (response.reading.status === ReadingStatus.REJECTED) {
          setStatus("REJECTED");
          setRejectReason(response.reading.rejectReason);
        }
      } catch (err: any) {
        const statusCode = err?.response?.status;
        const errCode = err?.response?.data?.error?.code;
        const errDetails = err?.response?.data?.error?.details;

        if (errDetails?.creditBalance !== undefined) {
          updateUser({ creditBalance: errDetails.creditBalance });
        }

        if (statusCode === 402 || errCode === "INSUFFICIENT_CREDITS") {
          setStatus("INSUFFICIENT_CREDITS");
          updateUser({ creditBalance: 0 });
        } else if (statusCode === 409 || errCode === "READING_IN_PROGRESS") {
          const readingId = errDetails?.readingId;
          if (readingId) {
            setPollingReadingId(readingId);
          } else {
            setStatus("NETWORK_ERROR");
            setErrorMessage("Lần xem bói trước đang xử lý.");
          }
        } else if (statusCode === 503 || errCode === "AI_UNAVAILABLE") {
          setStatus("AI_UNAVAILABLE");
          idempotencyKeyRef.current = null;
        } else {
          setStatus("NETWORK_ERROR");
          setErrorMessage(
            err?.response?.data?.error?.message ||
              "Không thể kết nối đến máy chủ. Vui lòng thử lại."
          );
        }
      }
    },
    [
      imageFile,
      isAllTopics,
      selectedSections,
      selectedAspects,
      school,
      hand,
      aiConsent,
      createReading,
      navigate,
      updateUser,
    ]
  );

  const handleSubmit = () => {
    doSubmit(false);
  };

  const handleRetrySameKey = () => {
    doSubmit(true);
  };

  const handleRetryNewKey = () => {
    doSubmit(false);
  };

  return (
    <main className="w-full min-h-[calc(100vh-72px)] text-ink py-8 sm:py-12">
      <div className="max-w-[1100px] mx-auto px-4">
        <div
          aria-hidden="true"
          className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-hairline pb-4 gap-2"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-[#d4af37] font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Đài Chiêm Tinh · Nghi Thức Xem Chỉ Tay
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#f7e7b4] m-0">
              Khởi tạo Quẻ Bói Chỉ Tay
            </p>
          </div>
          <span className="text-xs font-rune text-mute tracking-widest">
            ✦ ☽ ☼ ☾ ✦
          </span>
        </div>

        {status === "ANALYZING" ? (
          <AnalyzingView />
        ) : (
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-10">
            <div className="relative w-full lg:w-[440px] shrink-0 mystic-card rounded-2xl p-6 sm:p-7 flex flex-col justify-start">
              <TarotCorners />
              <SchoolStep
                selectedSchool={school}
                onSelectSchool={handleSelectSchool}
              />
              <TopicsStep
                school={school}
                isAllTopics={isAllTopics}
                selectedSections={selectedSections}
                selectedAspects={selectedAspects}
                onChange={handleTopicsChange}
              />
              <HandStep school={school} hand={hand} onSelectHand={setHand} />
            </div>

            <div className="relative w-full flex-1 mystic-card rounded-2xl p-6 sm:p-7">
              <TarotCorners />
              <CaptureStep
                school={school}
                hand={hand}
                isAllTopics={isAllTopics}
                selectedCount={selectedCount}
                imageFile={imageFile}
                imagePreviewUrl={imagePreviewUrl}
                aiConsent={aiConsent}
                onConsentChange={setAiConsent}
                onImageChange={handleImageChange}
                onSubmit={handleSubmit}
                onRetry={
                  status === "AI_UNAVAILABLE"
                    ? handleRetryNewKey
                    : handleRetrySameKey
                }
                status={status}
                errorMessage={errorMessage}
                rejectReason={rejectReason}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Scan;
