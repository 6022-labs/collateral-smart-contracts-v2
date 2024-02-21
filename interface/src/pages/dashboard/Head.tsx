import React from "react";
import { useAccount } from "wagmi";
import { truncateEthAddress } from "../../utils/eth-address";
import { useOwnedVaults } from "@/contexts/OwnedVaults";

export default function Head() {
  const { address } = useAccount();
  const { ownedVaults } = useOwnedVaults();

  const [rewardLocked, setRewardLocked] = React.useState<bigint>(BigInt(0));
  const [rewardAvailable, setRewardAvailable] = React.useState<bigint>(
    BigInt(0)
  );
  const [totalSmartContractLocked, setTotalSmartContractLocked] =
    React.useState<number>(0);
  const [totalSmartContractAvailable, setTotalSmartContractAvailable] =
    React.useState<number>(0);

  React.useEffect(() => {
    let rewardLocked = BigInt(0);
    let rewardAvailable = BigInt(0);
    let totalSmartContractLocked = 0;
    let totalSmartContractAvailable = 0;

    ownedVaults.forEach((vault) => {
      if (vault.lockedUntil > new Date().getTime() / 1000) {
        totalSmartContractLocked += 1;
        rewardLocked += vault.collectedRewards;
      } else {
        totalSmartContractAvailable += 1;
        rewardAvailable += vault.collectedRewards;
      }
    });

    setRewardLocked(rewardLocked);
    setRewardAvailable(rewardAvailable);
    setTotalSmartContractLocked(totalSmartContractLocked);
    setTotalSmartContractAvailable(totalSmartContractAvailable);
  }, [ownedVaults]);

  return (
    <div className="py-8 px-32 bg-primary text-white">
      <div className="flex justify-between">
        <div className="py-4">
          <div className="flex gap-x-4 items-center">
            <img className="h-10" src="/logo.svg" alt="logo" />
            <span className="font-semibold">Protocol 6022</span>
          </div>
        </div>
        <div className="flex flex-col gap-y-2">
          <div className="flex items-center gap-x-2">
            <span className="font-semibold underline underline-offset-4">
              My Collateral on
            </span>
            <span>{truncateEthAddress(address, 12, 10)}</span>
          </div>
          <div className="flex justify-between">
            <div className="flex gap-x-2">
              <div className="flex flex-col">
                <span>Total collateral locked</span>
                <span>Total collateral available now</span>
                <span>Reward locked</span>
                <span>Reward available</span>
              </div>
              <div className="flex flex-col">
                <span>:</span>
                <span>:</span>
                <span>:</span>
                <span>:</span>
              </div>
            </div>
            <div className="flex gap-x-2 ml-6">
              <div className="flex flex-col">
                <span>{totalSmartContractLocked}</span>
                <span>{totalSmartContractAvailable}</span>
                <span>{rewardLocked.toString()}</span>
                <span>{rewardAvailable.toString()}</span>
              </div>
              <div className="flex flex-col">
                <span>Smart Contract</span>
                <span>Smart Contract</span>
                <span>T6022</span>
                <span>T6022</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
