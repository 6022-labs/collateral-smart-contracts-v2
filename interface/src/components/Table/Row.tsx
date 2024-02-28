import clsx from "clsx";
import React from "react";
import { Cell } from "./Cell";

type RowProps = {
  collapsible?: boolean;
  collapsedContent?: React.ReactElement;
  children: Array<React.ReactElement<typeof Cell>>;
  onClick?: (
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
};

export function Row(props: Readonly<RowProps>) {
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const [collapsed, setCollapsed] = React.useState(true);
  const [visibleColumnsCount, setVisibleColumnsCount] = React.useState(0);

  const className = clsx(
    "text-center border-b border-gray-300 text-xs md:text-sm",
    props.collapsible ? "cursor-pointer hover:bg-gray-50" : ""
  );

  const updateVisibleColumnsCount = () => {
    let visibleColumns = 0;
    rowRef.current?.querySelectorAll("td").forEach((ref) => {
      if (getComputedStyle(ref).display !== "none") {
        visibleColumns++;
      }
    });
    setVisibleColumnsCount(visibleColumns);
  };

  React.useEffect(() => {
    window.addEventListener("resize", updateVisibleColumnsCount);
    // Initial check
    updateVisibleColumnsCount();
    return () => {
      window.removeEventListener("resize", updateVisibleColumnsCount);
    };
  }, []);

  return (
    <>
      <tr
        ref={rowRef}
        className={className}
        onClick={() => {
          if (props.onClick) {
            props.onClick(setCollapsed);
          }
        }}
      >
        {props.children}
      </tr>
      {props.collapsible && !collapsed && (
        <tr>
          <td colSpan={visibleColumnsCount}>{props.collapsedContent}</td>
        </tr>
      )}
    </>
  );
}
