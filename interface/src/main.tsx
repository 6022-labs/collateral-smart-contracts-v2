import "./index.css";
import React from "react";
import App from "./App.tsx";
import ReactDOM from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { polygonMumbai } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { ScreenContextProvider } from "./contexts/ScreenContext.tsx";
import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";

const { chains, publicClient } = configureChains(
  [polygonMumbai],
  [publicProvider()]
);

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [injectedWallet({ chains, shimDisconnect: true })],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <ScreenContextProvider>
          <App />
        </ScreenContextProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
