"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-6 mt-6 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`p-1 rounded-md ${
            currentPage === 1
              ? "text-zinc-200 cursor-not-allowed"
              : "text-zinc-600 hover:bg-zinc-800 hover:text-white cursor-pointer"
          }`}
          aria-label="Previous page"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const shouldShow =
              page === 1 ||
              page === totalPages ||
              Math.abs(currentPage - page) <= 1;

            if (!shouldShow) {
              if (
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <span key={`ellipsis-${page}`} className="text-zinc-500 px-1">
                    ...
                  </span>
                );
              }
              return null;
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                  currentPage === page
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`p-1 rounded-md ${
            currentPage === totalPages
              ? "text-zinc-200 cursor-not-allowed"
              : "text-zinc-600 hover:bg-zinc-800 hover:text-white cursor-pointer"
          }`}
          aria-label="Next page"
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="text-zinc-400 text-sm">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
