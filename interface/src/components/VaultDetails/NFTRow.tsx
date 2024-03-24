import clsx from "clsx";
import { Address } from "viem";
import { useAccount } from "wagmi";
import SmallButton from "../Button/SmallButton";
import SmallCopyButton from "../Button/SmallCopyButton";
import { ClassNameProps } from "@/types/ClassNameProps";
import { truncateEthAddress } from "@/utils/eth-address";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    props.owner === address ? "bg-lime-green" : "bg-slate-200"
  );

  return (
    <div
      className={className}
      title={props.owner !== address ? props.owner : undefined}
    >
      <div>
        {`Key ${props.tokenId.toString()} owned by ${
          props.owner === address ? "me" : truncateEthAddress(props.owner, 6, 6)
        }`}
      </div>
      {props.displaySendButton && (
        <SmallButton
          type="button"
          className="py-1"
          color="bg-white/30 text-black"
          onClick={() => {
            openModal(props.smartContractAddress, props.tokenId);
          }}
        >
          <FontAwesomeIcon className="w-3 h-3" icon={faPaperPlane} />
        </SmallButton>
      )}
      {props.owner !== address && (
        <SmallCopyButton
          className="py-1"
          color="bg-white/30 text-black"
          valueToCopy={props.owner}
        />
      )}
    </div>
  );
}
