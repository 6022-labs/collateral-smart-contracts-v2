import "./index.css";
import React from "react";
import App from "./App.tsx";
import { WagmiProvider } from "wagmi";
import ReactDOM from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { polygon } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";

const config = getDefaultConfig({
  ssr: false,
  chains: [polygon],
  appName: "Protocol 6022",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
