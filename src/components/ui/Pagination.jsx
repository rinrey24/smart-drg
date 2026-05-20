import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getPageNumbers(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, '…', totalPages];
  }
  if (page >= totalPages - 3) {
    return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '…', page - 1, page, page + 1, '…', totalPages];
}

const BTN_BASE =
  'flex items-center justify-center min-w-[30px] h-[30px] px-1.5 text-xs rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed';
const BTN_IDLE   = 'border-[#E4E9F1] text-[#64748B] hover:text-[#0E1A2B] hover:border-[#C8D8F4] bg-white';
const BTN_ACTIVE = 'bg-[#1E4F91] border-[#1E4F91] text-white font-semibold';

/**
 * Reusable pagination bar.
 *
 * Props:
 *   page            – current page (1-based)
 *   totalPages      – total number of pages
 *   total           – total number of records
 *   pageSize        – records per page
 *   onPageChange    – (n: number) => void
 *   onPageSizeChange – optional; (n: number) => void – shows page-size selector when provided
 *   className       – optional extra classes on the root div
 */
export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}) {
  const tp = Math.max(1, totalPages);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  const pages = getPageNumbers(page, tp);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-[#E4E9F1] bg-white',
        className
      )}
    >
      {/* ── Left: entry range + page-size picker ── */}
      <div className="flex items-center gap-3 text-xs text-[#64748B]">
        <span>
          {total > 0
            ? `${formatNumber(start)}–${formatNumber(end)} dari ${formatNumber(total)} entri`
            : '0 entri'}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#94A3B8]">per halaman</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // reset to first page when size changes
              }}
              className="text-xs border border-[#E4E9F1] rounded-md px-2 py-1 bg-white text-[#0E1A2B] outline-none cursor-pointer focus:border-[#1E4F91]/50 transition-all"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Right: page buttons ── */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={cn(BTN_BASE, BTN_IDLE, 'font-mono text-[11px]')}
          title="Halaman pertama"
        >
          «
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(BTN_BASE, BTN_IDLE)}
          title="Sebelumnya"
        >
          <ChevronLeft size={13} />
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-[11px] text-[#94A3B8] select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(BTN_BASE, p === page ? BTN_ACTIVE : BTN_IDLE)}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === tp}
          className={cn(BTN_BASE, BTN_IDLE)}
          title="Berikutnya"
        >
          <ChevronRight size={13} />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(tp)}
          disabled={page === tp}
          className={cn(BTN_BASE, BTN_IDLE, 'font-mono text-[11px]')}
          title="Halaman terakhir"
        >
          »
        </button>
      </div>
    </div>
  );
}
