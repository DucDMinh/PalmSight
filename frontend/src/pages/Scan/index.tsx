import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReadingSchool,
  HandOrientation,
  ReadingStatus,
  READING_SCHOOLS,
  LIFE_ASPECTS,
  ReadingDto,
} from "@palmsight/shared";
import { useAuth } from "@/providers/AuthenticationProvider";
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

  // Load remembered school
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
      // Ignore localStorage read errors
    }
    return ReadingSchool.EASTERN;
  });

  // Topics
  const [isAllTopics, setIsAllTopics] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>(() =>
    READING_SCHOOLS[ReadingSchool.EASTERN].sections.map((s) => s.key)
  );
  const [selectedAspects, setSelectedAspects] = useState<string[]>(() =>
    LIFE_ASPECTS.map((a) => a.key)
  );

  // Hand
  const [hand, setHand] = useState<HandOrientation>(HandOrientation.LEFT);

  // Photo & consent
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(false);

  // Flow status & errors
  const [status, setStatus] = useState<ScanStatus>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [pollingReadingId, setPollingReadingId] = useState<string | null>(null);

  // Idempotency key
  const idempotencyKeyRef = useRef<string | null>(null);

  const { mutateAsync: createReading } = useCreateReadingMutation();

  // School selection change
  const handleSelectSchool = useCallback(
    (newSchool: ReadingSchool) => {
      setSchool(newSchool);
      try {
        localStorage.setItem(LAST_SCHOOL_STORAGE_KEY, newSchool);
      } catch {
        // Ignore
      }
      // When switching school: reset school custom sections, preserve selected aspects
      const nextSections = READING_SCHOOLS[newSchool].sections.map((s) => s.key);
      setSelectedSections(nextSections);
    },
    []
  );

  // Topics selection change
  const handleTopicsChange = useCallback(
    (isAll: boolean, sections: string[], aspects: string[]) => {
      setIsAllTopics(isAll);
      setSelectedSections(sections);
      setSelectedAspects(aspects);
    },
    []
  );

  // Image change
  const handleImageChange = useCallback((file: File | null, preview: string | null) => {
    setImageFile(file);
    setImagePreviewUrl(preview);
    if (!file) {
      setStatus("IDLE");
      setRejectReason(null);
      setErrorMessage(null);
      idempotencyKeyRef.current = null;
    }
  }, []);

  const selectedCount = isAllTopics
    ? READING_SCHOOLS[school].sections.length + LIFE_ASPECTS.length
    : selectedSections.length + selectedAspects.length;

  // Polling completed callback
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

  // Submit flow
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

      // Topics param: omit if all topics
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

        // Sync credit balance
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
          // Generate new key on next attempt
          idempotencyKeyRef.current = null;
        } else {
          // Network error or timeout: keep same idempotencyKey for retry
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
    <main className="w-full bg-canvas min-h-[calc(100vh-56px)] text-ink font-body-md py-8">
      <div className="max-w-[960px] mx-auto px-4">
        {status === "ANALYZING" ? (
          <AnalyzingView />
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-10">
            {/* LEFT COLUMN: Configuration (400px) */}
            <div className="w-full md:w-[400px] shrink-0 flex flex-col justify-start">
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
              <HandStep
                school={school}
                hand={hand}
                onSelectHand={setHand}
              />
            </div>

            {/* 1px VERTICAL HAIRLINE DIVIDER */}
            <div
              aria-hidden="true"
              className="hidden md:block w-[1px] bg-hairline shrink-0 self-stretch"
            />

            {/* RIGHT COLUMN: Camera / Upload (520px) */}
            <div className="w-full md:w-[520px] shrink-0">
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
                onRetry={status === "AI_UNAVAILABLE" ? handleRetryNewKey : handleRetrySameKey}
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
