// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultDescriptorModule = buildModule("CollateralVaultDescriptor", (m) => {
  const CollateralVaultDescriptor = m.contract("CollateralVaultDescriptor");

  return { CollateralVaultDescriptor };
});

export default VaultDescriptorModule;
