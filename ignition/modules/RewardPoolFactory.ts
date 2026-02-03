// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ControllerModule from "./Controller";

const RewardPoolFactoryModule = buildModule(
  "RewardPoolFactory",
  (m) => {
    const { Controller } = m.useModule(ControllerModule);

    const tokenAddress = m.getParameter("tokenAddress");

    const RewardPoolFactory = m.contract("RewardPoolFactory", [
      Controller,
      tokenAddress,
    ]);

    return { RewardPoolFactory };
  }
);

export default RewardPoolFactoryModule;
