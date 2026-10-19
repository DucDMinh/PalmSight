import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Share2, Trash2, ArrowLeft } from "lucide-react";
import BaseUrl from "@/consts/baseUrl";
import {
  ReadingDto,
  READING_SCHOOLS,
  HandOrientation,
  getTopicLabel,
} from "@palmsight/shared";
import { format } from "date-fns";
import { TarotCorners } from "@/components/mystic/MysticDivider";

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
    }
  };

  return (
    <div className="w-full lg:w-[310px] shrink-0 lg:sticky lg:top-24 self-start">
      <div className="mb-5">
        <Link
          to={BaseUrl.Readings}
          className="inline-flex items-center gap-1.5 text-sm text-[#f7e7b4] hover:text-[#d4af37] transition-colors cursor-pointer"
          data-testid="back-to-history"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          <span>&lt; Lịch sử</span>
        </Link>
      </div>

      <div className="relative mystic-card rounded-2xl p-5">
        <TarotCorners />

        <div
          className="relative w-full h-[190px] bg-gradient-to-b from-[#0b0716] via-[#1c1136] to-[#0b0716] border border-[#d4af37]/40 flex flex-col items-center justify-center p-4 text-center select-none rounded-xl overflow-hidden"
          data-testid="reading-emblem"
        >
          <svg
            aria-hidden="true"
            className="absolute w-40 h-40 text-[#d4af37]/15 animate-spin-slow pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <polygon
              points="100,15 125,75 185,100 125,125 100,185 75,125 15,100 75,75"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>

          <span className="relative z-10 text-[11px] font-rune text-[#d4af37] tracking-[0.2em] uppercase">
            ✦ SYS::READING_LOG ✦
          </span>
          <span className="relative z-10 font-display text-lg font-bold text-[#f7e7b4] mt-2">
            [{schoolConfig?.name ?? reading.school}]
          </span>
          <span className="relative z-10 text-xs font-rune text-body mt-1">
            {handLabel} // 1080P
          </span>
          <span className="relative z-10 text-[10px] text-mute mt-3 font-rune border border-[#d4af37]/30 bg-[#0b0716]/80 px-2.5 py-0.5 rounded-full">
            NO_IMAGE_STORED // ADR-0010
          </span>
        </div>

        <div className="mt-5 text-left">
          <h2 className="font-display text-2xl text-[#f7e7b4] font-bold">
            {schoolConfig?.name ?? reading.school}
          </h2>
          <p className="text-xs sm:text-sm text-mute mt-1 font-rune">
            {handLabel} · {formattedDate}
          </p>
          <div className="mt-3">
            <span
              className="inline-block bg-[#241842] border border-[#d4af37]/45 text-[#f7e7b4] text-xs px-3 py-0.5 rounded-full select-none font-rune"
              data-testid="reading-topics-badge"
            >
              {topicsBadge}
            </span>
          </div>
          {!isAll && reading.topics && reading.topics.length > 0 && (
            <div
              className="mt-3 flex flex-wrap gap-1.5"
              data-testid="reading-selected-topics"
            >
              {reading.topics.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-0.5 bg-[#0b0716]/70 border border-hairline rounded-full font-rune text-body"
                >
                  [{getTopicLabel(t, reading.school)}]
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-hairline flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(BaseUrl.Scan)}
            className="btn-primary w-full text-xs sm:text-sm py-2.5 px-4 text-center leading-snug"
            data-testid="re-scan-button"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>Bói thêm mục khác / trường phái khác (−1 credit)</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="btn-secondary w-full text-xs sm:text-sm py-2 px-4 text-center"
            data-testid="share-button"
          >
            <Share2
              aria-hidden="true"
              className="h-3.5 w-3.5 text-[#d4af37] shrink-0"
            />
            <span>{copied ? "Đã sao chép văn bản" : "Chia sẻ phần chữ"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenDelete}
            className="w-full bg-[#4c0519]/25 text-danger border border-danger/50 font-medium text-xs sm:text-sm min-h-[38px] py-2 px-3 text-center rounded-full hover:bg-[#4c0519]/50 transition-colors leading-tight cursor-pointer inline-flex items-center justify-center gap-2"
            data-testid="delete-button"
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span>Xoá lần xem này</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadingHeader;
