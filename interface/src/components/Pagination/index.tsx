import PaginationButton from "./PaginationButton";

type PaginationProps = {
  pages: number;
  currentPage: number;
  onPaginate: (page: number) => void;
};

export default function Pagination(props: Readonly<PaginationProps>) {
  const visiblePages = () => {
    const pages = [];
    if (props.currentPage > 1) pages.push(props.currentPage - 1);
    pages.push(props.currentPage);
    if (props.currentPage < props.pages) pages.push(props.currentPage + 1);
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-x-2">
      <PaginationButton
        current={false}
        onClick={() => {
          if (props.currentPage > 1) {
            props.onPaginate(props.currentPage - 1);
          }
        }}
      >
        {"<"}
      </PaginationButton>
      {visiblePages().map((page) => (
        <PaginationButton
          current={page === props.currentPage}
          onClick={() => {
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
          if (props.currentPage < props.pages) {
            props.onPaginate(props.currentPage + 1);
          }
        }}
      >
        {">"}
      </PaginationButton>
    </div>
  );
}
