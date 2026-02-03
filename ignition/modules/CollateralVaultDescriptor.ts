// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultDescriptorModule = buildModule("CollateralVaultDescriptor", (m) => {
  const ipfsGateway = m.getParameter("ipfsGateway", "ipfs://");
  const CollateralVaultDescriptor = m.contract("CollateralVaultDescriptor", [
    ipfsGateway,
  ]);

  return { CollateralVaultDescriptor };
});

export default VaultDescriptorModule;
