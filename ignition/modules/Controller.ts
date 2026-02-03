// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ControllerModule = buildModule("Controller", (m) => {
  const Controller = m.contract("Controller");

  return { Controller };
});

export default ControllerModule;
