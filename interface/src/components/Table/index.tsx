import clsx from "clsx";
import React from "react";
import { Row } from "./Row";
import { ClassNameProps } from "@/types/ClassNameProps";

type ColumnProps = ClassNameProps & {
  name: string;
};

type TableProps = {
  columns: Array<ColumnProps>;
  children:
    | Array<React.ReactElement<typeof Row>>
    | React.ReactElement<typeof Row>;
};

export default function Table(props: Readonly<TableProps>) {
  return (
    <table className="table-fixed w-full">
      <thead className="text-xxs md:text-xs text-gray-700 md:uppercase bg-gray-50">
        <tr>
          {props.columns.map((column) => {
            let className = clsx("px-2 md:px-4 py-3", column.className);
            return (
              <th scope="col" className={className} key={column.name}>
                {column.name}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>{props.children}</tbody>
    </table>
  );
}
