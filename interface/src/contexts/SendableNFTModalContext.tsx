import React from "react";
import { Address } from "viem";
import SendNFTModal from "@/components/Modal/SendNFTModal";

type SendableNFTModalContextType = {
  openModal: (smartContractAddress: Address, tokenId: bigint) => void;
};

const SendableNFTModalContext = React.createContext<
  SendableNFTModalContextType | undefined
>(undefined);

type SendableNFTModalContextProviderProps = {
  children: React.ReactNode;
};

export function SendableNFTModalContextProvider(
  props: Readonly<SendableNFTModalContextProviderProps>
) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [tokenId, setTokenId] = React.useState<bigint>(BigInt(0));
  const [smartContractAddress, setSmartContractAddress] =
    React.useState<Address>("0x" as Address);

  const openModal = (smartContractAddress: Address, tokenId: bigint) => {
    setTokenId(tokenId);
    setSmartContractAddress(smartContractAddress);
    setIsModalOpen(true);
  };

  return React.useMemo(() => {
    return (
      <SendableNFTModalContext.Provider
        value={{
          openModal,
        }}
      >
        {props.children}
        <SendNFTModal
          isOpen={isModalOpen}
          tokenIdToSend={tokenId}
          setOpen={setIsModalOpen}
          smartContractAddress={smartContractAddress}
        />
      </SendableNFTModalContext.Provider>
    );
  }, [isModalOpen, tokenId, smartContractAddress]);
}

export function useSendableNFTModal() {
  const context = React.useContext(SendableNFTModalContext);
  if (context === undefined) {
    throw new Error(
      "useSendableNFTModal must be used within a SendableNFTModalContextProvider"
    );
  }
  return context;
}
