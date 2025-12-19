// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Controller6022Module = buildModule("Controller6022", (m) => {
  const Controller6022 = m.contract("Controller6022");

  return { Controller6022 };
});

export default Controller6022Module;
