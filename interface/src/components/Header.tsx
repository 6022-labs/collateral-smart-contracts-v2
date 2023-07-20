import Switch from "./Switch";
import WalletConnectButton from "./WalletConnectButton";
import { useScreenContext } from "../contexts/ScreenContext";

export default function Header() {
  const { screenState, switchScreenState } = useScreenContext();

  return (
    <header className="py-4 bg-primary text-white lg:px-20 2xl:px-36">
      <div className="flex items-center">
        <div className="flex w-full justify-start items-center">
          <img className="h-12" src="/logo.svg" alt="logo" />
        </div>
        <div className="flex justify-center gap-x-10 items-center">
          <div className="flex items-center gap-x-4">
            <span className="font-semibold">Client</span>
            <Switch
              className="h-min"
              setEnabled={() => {
                switchScreenState();
              }}
              enabled={screenState === "insurer"}
            />
            <span className="font-semibold">Insurer</span>
          </div>
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
