import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import {
  ReadingDto,
  READING_SCHOOLS,
  HandOrientation,
  getTopicLabel,
} from "@palmsight/shared";
import { format } from "date-fns";

interface ReadingHeaderProps {
  reading: ReadingDto;
  onOpenDelete: () => void;
}

export const ReadingHeader: React.FC<ReadingHeaderProps> = ({
  reading,
  onOpenDelete,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const schoolConfig = READING_SCHOOLS[reading.school];
  const handLabel =
    reading.hand === HandOrientation.LEFT ? "Tay trái" : "Tay phải";

  const totalSections = schoolConfig?.sections?.length ?? 0;
  const isAll =
    !reading.topics ||
    reading.topics.length === 0 ||
    reading.topics.length >= totalSections + 6;

  const topicsBadge = isAll ? "Toàn bộ" : `${reading.topics.length} mục`;

  let formattedDate = "";
  try {
    formattedDate = format(new Date(reading.createdAt), "dd/MM/yyyy HH:mm");
  } catch {
    formattedDate = reading.createdAt;
  }

  const handleShare = async () => {
    const textPieces: string[] = [
      `PALMSIGHT - ${schoolConfig?.name ?? reading.school}`,
      `${handLabel} · ${formattedDate}`,
      `Mục xem: ${
        isAll
          ? "Toàn bộ"
          : (reading.topics || [])
              .map((t) => getTopicLabel(t, reading.school))
              .join(", ")
      }`,
      "",
    ];

    if (reading.result?.summary) {
      textPieces.push(`[Tóm tắt]\n${reading.result.summary}\n`);
    }

    if (reading.result?.sections && reading.result.sections.length > 0) {
      reading.result.sections.forEach((sec) => {
        textPieces.push(
          `[${sec.title}]\n[+] Quan sát: ${sec.observation}\n[+] Ý nghĩa: ${sec.meaning}\n`
        );
      });
    }

    if (reading.result?.aspects) {
      textPieces.push("[Khía cạnh cuộc sống]");
      Object.entries(reading.result.aspects).forEach(([k, v]) => {
        textPieces.push(`[+] ${k}: ${v}`);
      });
      textPieces.push("");
    }

    if (reading.result?.advice) {
      textPieces.push(`[Lời khuyên]\n${reading.result.advice}\n`);
    }

    const fullText = textPieces.join("\n");

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full md:w-[280px] shrink-0 sticky top-20 self-start font-mono">
      {/* Back link */}
      <div className="mb-6">
        <Link
          to={BaseUrl.Readings}
          className="inline-block font-body-md text-sm text-ink underline hover:text-mute transition-colors cursor-pointer"
          data-testid="back-to-history"
        >
          &lt; Lịch sử
        </Link>
      </div>

      {/* Emblem Box per ADR-0010: No palm photo storage */}
      <div
        className="w-full h-[180px] bg-surface-card border border-hairline flex flex-col items-center justify-center p-4 text-center select-none rounded-[4px]"
        data-testid="reading-emblem"
      >
        <span className="font-code-sm text-code-sm text-mute tracking-widest uppercase">
          SYS::READING_LOG
        </span>
        <span className="font-heading-md text-heading-md font-bold text-ink mt-2">
          [{schoolConfig?.name ?? reading.school}]
        </span>
        <span className="font-code-sm text-code-sm text-ash mt-1">
          {handLabel} // 1080P
        </span>
        <span className="text-[10px] text-mute mt-3 font-mono border border-hairline px-2 py-0.5 rounded">
          NO_IMAGE_STORED // ADR-0010
        </span>
      </div>

      {/* Meta */}
      <div className="mt-4 text-left">
        <h2 className="font-heading-md text-heading-md text-ink font-bold">
          {schoolConfig?.name ?? reading.school}
        </h2>
        <p className="font-body-sm text-body-sm text-mute mt-0.5">
          {handLabel} · {formattedDate}
        </p>
        <div className="mt-2">
          <span
            className="inline-block bg-surface-dark text-on-dark font-body-sm text-xs px-2 py-0.5 rounded-[4px] select-none font-mono"
            data-testid="reading-topics-badge"
          >
            {topicsBadge}
          </span>
        </div>
        {!isAll && reading.topics && reading.topics.length > 0 && (
          <div
            className="mt-2.5 flex flex-wrap gap-1"
            data-testid="reading-selected-topics"
          >
            {reading.topics.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 bg-surface-card border border-hairline rounded font-mono text-ink"
              >
                [{getTopicLabel(t, reading.school)}]
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate(BaseUrl.Scan)}
          className="w-full bg-surface-dark text-on-dark font-button-md text-sm min-h-[36px] py-2 px-3 text-center rounded-[4px] hover:bg-surface-dark-elevated transition-colors leading-tight cursor-pointer"
          data-testid="re-scan-button"
        >
          Bói thêm mục khác / trường phái khác (−1 credit)
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="w-full bg-canvas text-ink border border-hairline-strong font-button-md text-sm min-h-[36px] py-2 px-3 text-center rounded-[4px] hover:bg-surface-soft transition-colors leading-tight cursor-pointer"
          data-testid="share-button"
        >
          {copied ? "Đã sao chép văn bản" : "Chia sẻ phần chữ"}
        </button>

        <button
          type="button"
          onClick={onOpenDelete}
          className="w-full bg-canvas text-danger border border-danger font-button-md text-sm min-h-[36px] py-2 px-3 text-center rounded-[4px] hover:bg-error-container transition-colors leading-tight cursor-pointer"
          data-testid="delete-button"
        >
          Xoá lần xem này
        </button>
      </div>
    </div>
  );
};

export default ReadingHeader;
