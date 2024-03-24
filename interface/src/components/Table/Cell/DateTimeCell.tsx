import Cell from ".";
import { ClassNameProps } from "@/types/ClassNameProps";

type DateCellProps = ClassNameProps & {
  timestamp: bigint | number;
};

export default function DateTimeCell(props: Readonly<DateCellProps>) {
  const date = new Date(
    typeof props.timestamp === "bigint"
      ? Number(props.timestamp) * 1000
      : props.timestamp * 1000
  );

  return (
    <Cell className={props.className}>
      <div className="flex flex-col">
        <span>{date.toLocaleDateString().toString().padStart(2, "0")}</span>
        <span>{`${date.getHours()}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`}</span>
      </div>
    </Cell>
  );
}
