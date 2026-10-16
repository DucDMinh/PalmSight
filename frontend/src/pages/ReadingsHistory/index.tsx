import React, { useState } from "react";
import { Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import useReadingsQuery from "./hooks/useReadingsQuery";
import ReadingHistoryItem from "./components/ReadingHistoryItem";
import Loading from "@/components/ui/loading";

export const ReadingsHistory: React.FC = () => {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading, isError } = useReadingsQuery(cursor);

  const items = data?.items ?? [];
  const nextCursor = data?.nextCursor;

  return (
    <main className="w-full bg-canvas min-h-[calc(100vh-56px)] py-8 text-ink font-body-md">
      <div className="max-w-[960px] mx-auto px-4">
        {/* Header */}
        <div className="w-full pb-3 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading-md text-heading-md text-ink font-bold tracking-tight text-left m-0">
            Lịch sử xem bói
          </h1>
          <div className="flex items-center gap-4">
            <Link
              to={BaseUrl.Scan}
              className="px-3 py-1.5 bg-ink text-on-dark rounded font-button-md text-xs hover:bg-charcoal transition-colors cursor-pointer font-mono inline-flex items-center gap-1"
              data-testid="new-reading-btn"
            >
              + Xem bói mới
            </Link>
            <span className="font-code-sm text-code-sm text-mute uppercase tracking-widest font-mono">
              RECORD_LOG :: {String(items.length).padStart(2, "0")}_ENTRIES
            </span>
          </div>
        </div>

        <div className="w-full h-px bg-hairline mb-6" />

        {isLoading ? (
          <div className="py-16 flex items-center justify-center font-mono">
            <Loading />
          </div>
        ) : isError ? (
          <div className="py-12 text-center font-mono text-danger">
            [!] Không thể tải lịch sử xem bói. Vui lòng thử lại sau.
          </div>
        ) : items.length === 0 ? (
          <div
            className="w-full py-16 text-center border border-dashed border-hairline rounded my-6 font-mono"
            data-testid="empty-readings"
          >
            <p className="text-mute text-sm mb-4">
              Chưa có lần xem bói nào trong lịch sử.
            </p>
            <Link
              to={BaseUrl.Scan}
              className="inline-block px-4 py-2 bg-ink text-on-dark rounded font-button-md text-sm hover:bg-charcoal transition-colors cursor-pointer"
            >
              Bắt đầu xem bói
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse table-fixed">
              <thead>
                <tr className="h-11">
                  <th className="w-[72px] font-caption-md text-caption-md text-mute font-normal p-0 align-middle text-left font-mono">
                    Trường phái
                  </th>
                  <th className="w-[220px] font-caption-md text-caption-md text-mute font-normal p-0 align-middle text-left font-mono">
                    Lần xem
                  </th>
                  <th className="w-[340px] font-caption-md text-caption-md text-mute font-normal p-0 align-middle text-left font-mono">
                    Tóm tắt
                  </th>
                  <th className="w-[150px] font-caption-md text-caption-md text-mute font-normal p-0 align-middle text-left font-mono">
                    Ngày
                  </th>
                  <th className="w-[178px] font-caption-md text-caption-md text-mute font-normal p-0 align-middle text-left font-mono">
                    Trạng thái
                  </th>
                </tr>
                <tr>
                  <td className="p-0" colSpan={5}>
                    <div className="w-full h-px bg-hairline" />
                  </td>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ReadingHistoryItem key={item.id} item={item} />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {nextCursor && (
              <div className="mt-6 text-left">
                <button
                  type="button"
                  onClick={() => setCursor(nextCursor)}
                  className="font-body-strong text-body-strong text-ink underline hover:text-mute transition-colors inline-block cursor-pointer font-mono text-sm"
                  data-testid="load-more-btn"
                >
                  Tải thêm
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default ReadingsHistory;
