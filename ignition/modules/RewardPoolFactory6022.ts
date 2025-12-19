// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import Controller6022Module from "./Controller6022";

const RewardPoolFactory6022Module = buildModule(
  "RewardPoolFactory6022",
  (m) => {
    const { Controller6022 } = m.useModule(Controller6022Module);

    const token6022Address = m.getParameter("token6022Address");

    const RewardPoolFactory6022 = m.contract("RewardPoolFactory6022", [
      Controller6022,
      token6022Address,
    ]);

    return { RewardPoolFactory6022 };
  }
);

export default RewardPoolFactory6022Module;
