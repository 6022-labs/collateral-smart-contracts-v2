import clsx from "clsx";
import { Cell } from "./Cell";
import React, { Dispatch, SetStateAction } from "react";

type RowProps = {
  collapsible?: boolean;
  collapsedContent?: React.ReactElement;
  children: Array<React.ReactElement<typeof Cell>>;
  onClick?: (setCollapsed: Dispatch<SetStateAction<boolean>>) => void;
};

export function Row(props: Readonly<RowProps>) {
  const [collapsed, setCollapsed] = React.useState(true);

  const className = clsx(
    "text-center border-b border-gray-300 text-sm",
    props.collapsible ? "cursor-pointer hover:bg-gray-50" : ""
  );

  return (
    <>
      <tr
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
          <td colSpan={props.children.length}>{props.collapsedContent}</td>
        </tr>
      )}
    </>
  );
}
