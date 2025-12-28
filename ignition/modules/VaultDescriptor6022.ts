// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultDescriptor6022Module = buildModule("VaultDescriptor6022", (m) => {
  const VaultDescriptor6022 = m.contract("VaultDescriptor6022");

  return { VaultDescriptor6022 };
});

export default VaultDescriptor6022Module;
