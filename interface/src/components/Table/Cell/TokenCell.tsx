import Cell from ".";
import React from "react";
import { formatUnits } from "viem";
import { getImageUrl } from "@/utils/coingecko";
import { ClassNameProps } from "@/types/ClassNameProps";

type TokenCellProps = ClassNameProps & {
  symbol: string;
  amount: bigint;
  decimals: number;
  imageUrl?: string;
  type: "coin" | "nft";
  smartContractAddress: string;
};

export default function TokenCell(props: Readonly<TokenCellProps>) {
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (props.imageUrl) {
      setImageUrl(props.imageUrl);
      return;
    }

    (async () => {
      try {
        let url = await getImageUrl(props.smartContractAddress, props.type);
        if (url) {
          setImageUrl(url);
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  return (
    <Cell className={props.className}>
      <div className="flex justify-center items-center gap-x-1">
        <span>{formatUnits(props.amount, props.decimals)}</span>
        <span>{props.symbol}</span>
        {imageUrl && (
          <img
            src={imageUrl}
            className="h-2.5 w-2.5 md:h-5 md:w-5"
            alt={`${props.symbol}-icon`}
          />
        )}
      </div>
    </Cell>
  );
}
