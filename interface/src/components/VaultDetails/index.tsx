import Content from "./Content";
import { Vault } from "@/types/Vault";
import { VaultDetailsContextProvider } from "@/contexts/VaultDetailsContext";
import { SendableNFTModalContextProvider } from "@/contexts/SendableNFTModalContext";

type VaultDetailsProps = {
  data: Vault;
};

export default function VaultDetails(props: Readonly<VaultDetailsProps>) {
  return (
    <VaultDetailsContextProvider vaultAddress={props.data.address}>
      <SendableNFTModalContextProvider>
        <Content data={props.data} />
      </SendableNFTModalContextProvider>
    </VaultDetailsContextProvider>
  );
}
