import React from "react";
import { Row } from "./Row";

type ColumnProps = {
  name: string;
};

type TableProps = {
  columns: Array<ColumnProps>;
  children:
    | Array<React.ReactElement<typeof Row>>
    | React.ReactElement<typeof Row>;
};

export default function Table(props: Readonly<TableProps>) {
  const [currentPage, setCurrentPage] = React.useState(1);

  return (
    <table className="table-fixed w-full">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
        <tr>
          {props.columns.map((column, index) => (
            <th scope="col" className="px-6 py-3" key={index}>
              {column.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{props.children}</tbody>
    </table>
  );
}
