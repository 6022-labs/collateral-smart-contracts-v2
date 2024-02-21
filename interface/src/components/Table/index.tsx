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
  return (
    <table className="table-fixed w-full">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
        <tr>
          {props.columns.map((column) => (
            <th scope="col" className="px-4 py-3" key={column.name}>
              {column.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{props.children}</tbody>
    </table>
  );
}
