import clsx from "clsx";
import { Address } from "viem";
import { useAccount } from "wagmi";
import SmallButton from "../Button/SmallButton";
import { ClassNameProps } from "@/types/ClassNameProps";
import { truncateEthAddress } from "@/utils/eth-address";
import { useSendableNFTModal } from "@/contexts/SendableNFTModalContext";

type NFTRowProps = ClassNameProps & {
  owner: Address;
  tokenId: bigint;
  displaySendButton?: boolean;
  smartContractAddress: Address;
};

export default function NFTRow(props: Readonly<NFTRowProps>) {
  const { address } = useAccount();

  const { openModal } = useSendableNFTModal();

  const className = clsx(
    props.className,
    "pl-4 pr-2 py-1",
    "text-xxs text-black border border-black md:text-xs lg:text-sm",
    "flex justify-between items-center gap-x-4",
    props.owner === address ? "bg-blue-400" : "bg-slate-200"
  );

  return (
    <div className={className}>
      <div>
        {`NFT key ${props.tokenId.toString()} owned by ${
          props.owner === address
            ? "you"
            : truncateEthAddress(props.owner, 6, 6)
        }`}
      </div>
      {props.displaySendButton && (
        <SmallButton
          type="button"
          onClick={() => {
            openModal(props.smartContractAddress, props.tokenId);
          }}
        >
          Send
        </SmallButton>
      )}
    </div>
  );
}
