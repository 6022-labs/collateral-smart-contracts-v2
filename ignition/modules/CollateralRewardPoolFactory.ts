// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import ControllerModule from "./CollateralController";

const RewardPoolFactoryModule = buildModule(
  "CollateralRewardPoolFactory",
  (m) => {
    const { CollateralController } = m.useModule(ControllerModule);

    const tokenAddress = m.getParameter("tokenAddress");

    const CollateralRewardPoolFactory = m.contract(
      "CollateralRewardPoolFactory",
      [CollateralController, tokenAddress],
      {
        after: [CollateralController],
      },
    );

    m.call(CollateralController, "addFactory", [CollateralRewardPoolFactory], {
      after: [CollateralController, CollateralRewardPoolFactory],
    });

    return { CollateralRewardPoolFactory };
  },
);

export default RewardPoolFactoryModule;
