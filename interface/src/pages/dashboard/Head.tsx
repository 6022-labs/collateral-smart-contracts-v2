import { useAccount } from "wagmi";
import { truncateEthAddress } from "../../utils/eth-address";

export default function Head() {
  const { address } = useAccount();

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
            <div className="flex gap-x-2">
              <div className="flex flex-col">
                <span>5000</span>
                <span>5000</span>
                <span>5000</span>
                <span>5000</span>
              </div>
              <div className="flex flex-col">
                <span>USDT</span>
                <span>USDT</span>
                <span>USDT</span>
                <span>USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
