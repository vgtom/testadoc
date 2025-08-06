import { cn } from "../lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { type FC } from "react";

// Define props interface
interface PaginationProps {
  total?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
}

// Utility function to generate page range
const getPageRange = (
  currentPage: number,
  totalPages: number,
  maxPages: number = 5
) => {
  const halfMax = Math.floor(maxPages / 2);
  let start = Math.max(1, currentPage - halfMax);
  let end = Math.min(totalPages, start + maxPages - 1);

  if (end === totalPages) {
    start = Math.max(1, end - maxPages + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return {
    pages,
    showLeftEllipsis: start > 1,
    showRightEllipsis: end < totalPages,
  };
};

export const CustomPagination: FC<PaginationProps> = ({
  total,
  currentPage,
  onPageChange,
  pageSize = 10,
}) => {
  if (!total || !currentPage) return;
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages < 1 || currentPage < 1 || currentPage > totalPages) {
    return null;
  }

  const { pages, showLeftEllipsis, showRightEllipsis } = getPageRange(
    currentPage,
    totalPages
  );

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange?.(currentPage - 1)}
            className={cn(currentPage === 1 ? "pointer-events-none hidden" : "")}

            aria-disabled={currentPage === 1}
          />
        </PaginationItem>
        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => onPageChange?.(page)}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange?.(currentPage + 1)}
            className={cn(currentPage === totalPages ? "pointer-events-none hidden" : "")}
            aria-disabled={currentPage === totalPages}

          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
