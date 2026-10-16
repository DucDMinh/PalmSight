import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import { READING_SCHOOLS, ImageQuality } from "@palmsight/shared";
import ReadingHeader from "./components/ReadingHeader";
import SectionBlock from "./components/SectionBlock";
import AspectsBlock from "./components/AspectsBlock";
import DeleteModal from "./components/DeleteModal";
import useReadingDetailQuery, {
  useDeleteReadingMutation,
} from "./hooks/useReadingDetailQuery";
import Loading from "@/components/ui/loading";

export const ReadingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: reading, isLoading, isError, error } = useReadingDetailQuery(id);
  const { mutateAsync: deleteReading, isPending: isDeleting } =
    useDeleteReadingMutation();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteReading(id);
      setIsDeleteOpen(false);
      navigate(BaseUrl.Readings);
    } catch {
      // Handled by global/query error handling
    }
  };

  if (isLoading) {
    return (
      <main className="w-full bg-canvas min-h-[calc(100vh-56px)] flex items-center justify-center p-8 font-mono">
        <Loading />
      </main>
    );
  }

  if (isError || !reading) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <main className="w-full bg-canvas min-h-[calc(100vh-56px)] py-16 px-4 font-mono text-center">
        <div className="max-w-[480px] mx-auto border border-hairline p-8 rounded bg-surface-card">
          <h2 className="font-heading-md text-heading-md text-danger font-bold mb-2">
            [!] {is404 ? "Không tìm thấy lần xem bói" : "Lỗi tải dữ liệu"}
          </h2>
          <p className="font-body-md text-mute mb-6">
            {is404
              ? "Lần xem bói này không tồn tại hoặc đã bị xoá."
              : "Đã có lỗi xảy ra khi tải kết quả xem bói."}
          </p>
          <Link
            to={BaseUrl.Readings}
            className="inline-block px-4 py-2 bg-ink text-on-dark rounded font-button-md text-sm hover:bg-charcoal transition-colors"
          >
            Quay lại Lịch sử
          </Link>
        </div>
      </main>
    );
  }

  const result = reading.result;
  const schoolConfig = READING_SCHOOLS[reading.school];
  const schoolName = schoolConfig?.name ?? reading.school;
  const isPoorQuality = result?.imageQuality === ImageQuality.POOR;

  return (
    <main className="w-full bg-canvas min-h-[calc(100vh-56px)] py-12 text-ink font-body-md">
      <div className="max-w-[960px] mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* LEFT SIDEBAR: Meta & actions (no palm photo per ADR-0010) */}
          <ReadingHeader
            reading={reading}
            onOpenDelete={() => setIsDeleteOpen(true)}
          />

          {/* RIGHT COLUMN: Reading Content */}
          <div className="w-full md:w-[640px] flex flex-col text-left">
            {/* Top Bar */}
            <div className="font-body-sm text-body-sm text-mute pb-4 border-b border-hairline flex justify-between items-baseline select-none font-mono">
              <span>PALMSIGHT(1)</span>
              <span>{schoolName}</span>
            </div>

            {/* Quality warning banner */}
            {isPoorQuality && (
              <div
                className="mt-4 p-3 bg-surface-card border border-warning/60 text-warning text-xs font-mono rounded"
                data-testid="poor-quality-warning"
              >
                [!] Ảnh hơi mờ, kết quả có thể chưa chính xác.
              </div>
            )}

            {/* Summary */}
            {result?.summary && (
              <section className="pt-6 pb-6 border-b border-hairline text-left" data-testid="reading-summary-section">
                <h3 className="font-heading-md text-heading-md text-ink pb-1 mb-2 border-b border-hairline font-bold">
                  Tóm tắt
                </h3>
                <p className="font-body-md text-body-md text-body leading-relaxed m-0">
                  {result.summary}
                </p>
              </section>
            )}

            {/* Sections */}
            <SectionBlock sections={result?.sections} />

            {/* Aspects */}
            <AspectsBlock aspects={result?.aspects} />

            {/* Advice */}
            {result?.advice && (
              <section className="pt-6 pb-6 border-b border-hairline text-left" data-testid="reading-advice-section">
                <h3 className="font-heading-md text-heading-md text-ink pb-1 mb-2 border-b border-hairline font-bold">
                  Lời khuyên
                </h3>
                <p className="font-body-md text-body-md text-body leading-relaxed m-0">
                  {result.advice}
                </p>
              </section>
            )}

            {/* Disclaimer */}
            <div className="mt-6 mb-8 border border-hairline-strong bg-transparent p-4 font-mono text-left" data-testid="reading-disclaimer">
              <p className="font-caption-md text-caption-md text-mute m-0">
                [i] {result?.disclaimer || "Kết quả mang tính giải trí, không thay thế tư vấn chuyên môn."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </main>
  );
};

export default ReadingDetail;
