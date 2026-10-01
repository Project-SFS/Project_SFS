import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export const PAGE_SIZE = 25;

// Client-side paging for a list that is already filtered and sorted.
// resetKey: anything describing the current filters; when it changes the list goes back to page 1.
export const usePagination = (items, { pageSize = PAGE_SIZE, resetKey } = {}) => {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // stay on a real page when the list shrinks (e.g. after a delete)
  const current = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize]
  );

  return { page: current, setPage, pageItems, total, totalPages, pageSize };
};

// Page numbers to show: first, last, and a window around the current page, with gaps as "…"
const pageList = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`);
    result.push(p);
  });
  return result;
};

// "Showing 26–50 of 112" with previous / next and page buttons. Hidden when everything fits on one page.
const Pagination = ({ page, totalPages, total, pageSize = PAGE_SIZE, onChange, label = "items", className = "" }) => {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const go = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
  };

  const button = "min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center";

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-4 ${className}`}
      aria-label="Pagination"
    >
      <p className="text-sm text-[#718096]">
        Showing <span className="font-semibold text-[#1A202C]">{from}–{to}</span> of{" "}
        <span className="font-semibold text-[#1A202C]">{total}</span> {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 1}
          className={`${button} border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Previous page"
        >
          <FiChevronLeft />
        </button>
        {pageList(page, totalPages).map((p) =>
          typeof p === "string" ? (
            <span key={p} className="px-1 text-[#A0AEC0]">…</span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => go(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${button} ${p === page
                ? "bg-[#FF9900] text-white shadow-sm"
                : "border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-gray-50"
                }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
          className={`${button} border border-[#E2E8F0] bg-white text-[#4A5568] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
