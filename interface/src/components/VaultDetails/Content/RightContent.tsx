import React from "react";
import NFTRow from "../NFTRow";
import { useAccount } from "wagmi";
import Card from "@/components/Card";
import { Vault } from "@/types/Vault";
import { roundWei } from "@/utils/wei";
import { useVaultDetails } from "@/contexts/VaultDetailsContext";

type RightContentProps = {
  vault: Vault;
};

const RightContent = React.forwardRef(
  (props: Readonly<RightContentProps>, ref: React.Ref<HTMLDivElement>) => {
    const { address = `0x${"default"}` } = useAccount();
    const { nftOwners } = useVaultDetails();

    return (
      <div ref={ref} className="flex justify-between gap-x-4">
        <Card className="flex flex-col justify-center gap-y-4 order-2 sm:order-1">
          <div className="text-center">Collateral</div>
          <div className="flex flex-col justify-center">
            <span className="text-center">{`${roundWei(
              props.vault.balanceOfWantedToken,
              props.vault.wantedTokenDecimals,
              4
            )} ${props.vault.wantedTokenSymbol}`}</span>
            {/* <span className="text-center">≈3500 USD</span> */}
          </div>
        </Card>
        <div className="flex flex-col justify-between h-full order-1 sm:order-2">
          {nftOwners.map((owner, index) => {
            return (
              <NFTRow
                key={index}
                owner={owner}
                tokenId={BigInt(index + 1)}
                smartContractAddress={props.vault.address}
                displaySendButton={
                  index === 0 &&
                  nftOwners.find((nftOwner) => nftOwner !== address) ===
                    undefined
                }
              />
            );
          })}
        </div>
      </div>
    );
  }
);

export default RightContent;
