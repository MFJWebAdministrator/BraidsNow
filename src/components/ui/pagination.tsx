import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationParams } from "@/pages/FindStylists/types";

export function Pagination({
    pagination,
    onPaginationChange,
}: {
    pagination: PaginationParams;
    onPaginationChange: (pagination: PaginationParams) => void;
}) {
    const getPageNumbers = () => {
        const pages: Array<number | string> = [];
        const maxVisible = 5;

        if (pagination.totalPages <= maxVisible) {
            for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);
        } else if (pagination.currentPage <= 3) {
            pages.push(1, 2, 3, 4, "...", pagination.totalPages);
        } else if (pagination.currentPage >= pagination.totalPages - 2) {
            pages.push(
                1,
                "...",
                pagination.totalPages - 3,
                pagination.totalPages - 2,
                pagination.totalPages - 1,
                pagination.totalPages
            );
        } else {
            pages.push(
                1,
                "...",
                pagination.currentPage - 1,
                pagination.currentPage,
                pagination.currentPage + 1,
                "...",
                pagination.totalPages
            );
        }
        return pages;
    };

    const handlePageSizeChange = (newPageSize: number) => {
        onPaginationChange({
            ...pagination,
            pageSize: newPageSize,
            currentPage: 1,
        });
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Display */}
            <div className="text-sm text-gray-600 text-center sm:text-left">
                Results:{" "}
                {(pagination.currentPage - 1) * pagination.pageSize + 1} -{" "}
                {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    pagination.totalItems
                )}{" "}
                of {pagination.totalItems}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Page Navigation */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPaginationChange({
                                    ...pagination,
                                    currentPage: pagination.currentPage - 1,
                                })
                            }
                            disabled={!pagination.hasPreviousPage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {getPageNumbers().map((page, idx) => (
                            <Button
                                key={`${page}-${idx}`}
                                variant={
                                    page === pagination.currentPage
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                    typeof page === "number" &&
                                    onPaginationChange({
                                        ...pagination,
                                        currentPage: page,
                                    })
                                }
                                disabled={page === "..."}
                                className={
                                    page === "..." ? "cursor-default" : ""
                                }
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPaginationChange({
                                    ...pagination,
                                    currentPage: pagination.currentPage + 1,
                                })
                            }
                            disabled={!pagination.hasNextPage}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Page Size Selector */}
                <select
                    className="h-9 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
                    value={pagination.pageSize}
                    onChange={(e) =>
                        handlePageSizeChange(Number(e.target.value))
                    }
                >
                    {[2, 4, 6, 8, 10].map((size) => (
                        <option key={size} value={size}>
                            {size} per page
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
