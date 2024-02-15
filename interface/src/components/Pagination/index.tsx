import React from "react";
import PaginationButton from "./PaginationButton";

type PaginationProps = {
  pages: number;
  onPaginate: (page: number) => void;
};

export default function Pagination(props: Readonly<PaginationProps>) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const visiblePages = () => {
    const pages = [];
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < props.pages) pages.push(currentPage + 1);
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-x-2">
      <PaginationButton
        current={false}
        onClick={() => {
          if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
            props.onPaginate(currentPage - 1);
          }
        }}
      >
        {"<"}
      </PaginationButton>
      {visiblePages().map((page) => (
        <PaginationButton
          current={page === currentPage}
          onClick={() => {
            setCurrentPage(page);
            props.onPaginate(page);
          }}
          key={page}
        >
          {page}
        </PaginationButton>
      ))}
      <PaginationButton
        current={false}
        onClick={() => {
          if (currentPage < props.pages) {
            setCurrentPage((prev) => prev + 1);
            props.onPaginate(currentPage + 1);
          }
        }}
      >
        {">"}
      </PaginationButton>
    </div>
  );
}
