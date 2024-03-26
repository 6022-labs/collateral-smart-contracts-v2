import React from "react";
import NFTRow from "../NFTRow";
import { useAccount } from "wagmi";
import Card from "@/components/Card";
import { Vault } from "@/types/Vault";
import { roundWei } from "@/utils/wei";
import { useVaultDetails } from "@/contexts/VaultDetailsContext";
import { getImageUrl } from "@/utils/coingecko";

type RightContentProps = {
  vault: Vault;
};

const RightContent = React.forwardRef(
  (props: Readonly<RightContentProps>, ref: React.Ref<HTMLDivElement>) => {
    const { address = `0x${"default"}` } = useAccount();
    const { nftOwners } = useVaultDetails();

    const [imageUrl, setImageUrl] = React.useState<string | undefined>(
      undefined
    );

    React.useEffect(() => {
      (async () => {
        try {
          let url = await getImageUrl(
            props.vault.address,
            props.vault.storageType === BigInt(0) ? "coin" : "nft"
          );
          if (url) {
            setImageUrl(url);
          }
        } catch (error) {
          console.log(error);
        }
      })();
    }, []);

    return (
      <div ref={ref} className="flex justify-between gap-x-4">
        <Card className="flex flex-col justify-center gap-y-4 order-2 sm:order-1">
          <div className="text-center">Collateral</div>
          <div className="flex gap-x-1 justify-center items-center">
            <span>
              {roundWei(
                props.vault.balanceOfWantedToken,
                props.vault.wantedTokenDecimals,
                4
              )}
            </span>
            <span className="text-center">{props.vault.wantedTokenSymbol}</span>
            {props.vault.wantedTokenAddress ===
            import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS ? (
              <img
                alt="T6022-icon"
                src="/logo-32x32.png"
                className="h-2.5 w-2.5 md:h-5 md:w-5"
              />
            ) : (
              <img
                src={imageUrl}
                className="h-2.5 w-2.5 md:h-5 md:w-5"
                alt={`${props.vault.wantedTokenSymbol}-icon`}
              />
            )}
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
