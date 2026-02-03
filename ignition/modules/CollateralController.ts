// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ControllerModule = buildModule("CollateralController", (m) => {
  const CollateralController = m.contract("CollateralController");

  return { CollateralController };
});

export default ControllerModule;
