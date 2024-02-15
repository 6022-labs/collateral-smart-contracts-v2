import HeaderButton from "./HeaderButton";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              className: "opacity-0 pointer-events-none user-select-none",
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <HeaderButton type="button" onClick={openConnectModal}>
                    Connect Wallet
                  </HeaderButton>
                );
              }

              if (chain.unsupported) {
                return (
                  <HeaderButton onClick={openChainModal} type="button">
                    Wrong Network
                  </HeaderButton>
                );
              }

              return (
                <HeaderButton onClick={openAccountModal} type="button">
                  {account.displayName}
                </HeaderButton>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
