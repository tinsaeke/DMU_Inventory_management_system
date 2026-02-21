import { useState, useMemo } from "react";

export function usePagination<T>(data: T[], initialPageSize: number = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const totalPages = Math.ceil(safeData.length / pageSize);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return safeData.slice(startIndex, endIndex);
  }, [safeData, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems: safeData.length,
    paginatedData,
    handlePageChange,
    handlePageSizeChange,
  };
}
