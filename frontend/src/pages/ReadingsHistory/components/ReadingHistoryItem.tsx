import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ReadingListItemDto,
  ReadingStatus,
  ReadingSchool,
  HandOrientation,
  READING_SCHOOLS,
  getTopicLabel,
} from "@palmsight/shared";
import { format } from "date-fns";

interface ReadingHistoryItemProps {
  item: ReadingListItemDto;
}

export const ReadingHistoryItem: React.FC<ReadingHistoryItemProps> = ({ item }) => {
  const navigate = useNavigate();

  const isDone = item.status === ReadingStatus.DONE;
  const schoolConfig = READING_SCHOOLS[item.school];
  const rawName = schoolConfig?.name.replace("Chỉ tay ", "") ?? item.school;
  const schoolName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const handLabel = item.hand === HandOrientation.LEFT ? "Tay trái" : "Tay phải";

  const totalSections = schoolConfig?.sections?.length ?? 0;
  const isAll =
    !item.topics ||
    item.topics.length === 0 ||
    item.topics.length >= totalSections + 6;

  const topicsBadge = isAll ? "Toàn bộ" : `${item.topics.length} mục`;

  let formattedDate = "";
  try {
    formattedDate = format(new Date(item.createdAt), "dd/MM/yyyy HH:mm");
  } catch {
    formattedDate = item.createdAt;
  }

  const handleClick = () => {
    if (isDone) {
      navigate(`/readings/${item.id}`);
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case ReadingStatus.DONE:
        return (
          <span className="font-body-md text-body-md text-ink block font-mono">
            [+] Xong
          </span>
        );
      case ReadingStatus.REJECTED:
        return (
          <span className="font-caption-md text-caption-md text-danger block leading-normal font-mono">
            [!] Ảnh không rõ · đã hoàn 1 credit
          </span>
        );
      case ReadingStatus.FAILED:
        return (
          <span className="font-caption-md text-caption-md text-danger block leading-normal font-mono">
            [!] Hệ thống bận · đã hoàn 1 credit
          </span>
        );
      case ReadingStatus.PROCESSING:
        return (
          <span className="font-caption-md text-caption-md text-mute block leading-normal font-mono">
            [...] Đang xử lý
          </span>
        );
      default:
        return null;
    }
  };

  const getSchoolShortTag = () => {
    switch (item.school) {
      case ReadingSchool.WESTERN:
        return "TÂY";
      case ReadingSchool.EASTERN:
        return "ĐÔNG";
      case ReadingSchool.VEDIC:
        return "ẤN";
      default:
        return "PALM";
    }
  };

  return (
    <tr
      onClick={handleClick}
      className={`border-b border-hairline transition-colors ${
        isDone ? "hover:bg-surface-soft cursor-pointer" : ""
      }`}
      data-testid={`reading-item-${item.id}`}
    >
      {/* School Badge (No palm photo per ADR-0010) */}
      <td className="w-[72px] py-4 pr-4 align-top">
        <div
          className="w-[56px] h-[56px] bg-surface-card border border-hairline flex flex-col items-center justify-center font-mono select-none text-center"
          title={schoolConfig?.name}
        >
          <span className="text-[11px] font-bold text-ink tracking-wider">
            [{getSchoolShortTag()}]
          </span>
          <span className="text-[9px] text-mute uppercase tracking-tighter">
            SYS::LOG
          </span>
        </div>
      </td>

      {/* Lần xem */}
      <td className="w-[220px] py-4 pr-4 align-top">
        <span className="font-body-strong text-body-strong text-ink font-medium block">
          {schoolName} · {handLabel} · {topicsBadge}
        </span>
        {!isAll && item.topics && item.topics.length > 0 && (
          <span className="text-xs text-mute block mt-0.5 font-sans line-clamp-1">
            {item.topics.map((t) => getTopicLabel(t, item.school)).join(", ")}
          </span>
        )}
      </td>

      {/* Tóm tắt */}
      <td className="w-[340px] py-4 pr-6 align-top">
        {item.summary ? (
          <p className="font-body-md text-body-md text-body leading-relaxed m-0 text-left line-clamp-2">
            {item.summary}
          </p>
        ) : (
          <span className="font-body-md text-body-md text-mute block">—</span>
        )}
      </td>

      {/* Ngày */}
      <td className="w-[150px] py-4 pr-4 align-top">
        <span className="font-caption-md text-caption-md text-mute block font-mono text-xs">
          {formattedDate}
        </span>
      </td>

      {/* Trạng thái */}
      <td className="w-[178px] py-4 align-top">{getStatusBadge()}</td>
    </tr>
  );
};

export default ReadingHistoryItem;
