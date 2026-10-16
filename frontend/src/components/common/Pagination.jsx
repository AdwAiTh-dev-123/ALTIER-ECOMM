import React from "react";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  loading = false,
}) => {
  // If no items or only 1 page, don't show pagination
  if (totalPages <= 1 && totalItems <= limit) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  // Generate page numbers with smart ellipsis (e.g. [1, '...', 4, 5, 6, '...', 10])
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="admin-pagination-container">
      <div className="admin-pagination-info">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
        <strong>{totalItems}</strong> entries
      </div>

      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-pagination-btn"
          disabled={currentPage <= 1}
          onClick={(e) => {
            e.preventDefault();
            if (!loading && currentPage > 1) onPageChange(currentPage - 1);
          }}
        >
          ‹ Prev
        </button>

        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="admin-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`admin-pagination-page-btn ${
                currentPage === p ? "active" : ""
              }`}
              disabled={currentPage === p}
              onClick={(e) => {
                e.preventDefault();
                if (!loading && currentPage !== p) onPageChange(p);
              }}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="admin-pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={(e) => {
            e.preventDefault();
            if (!loading && currentPage < totalPages) onPageChange(currentPage + 1);
          }}
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
