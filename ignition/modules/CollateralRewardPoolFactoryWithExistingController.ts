// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RewardPoolFactoryWithExistingControllerModule = buildModule(
  "CollateralRewardPoolFactoryWithExistingController",
  (m) => {
    const collateralControllerAddress = m.getParameter(
      "collateralControllerAddress"
    );
    const tokenAddress = m.getParameter("tokenAddress");

    const CollateralController = m.contractAt(
      "CollateralController",
      collateralControllerAddress
    );

    const CollateralRewardPoolFactory = m.contract(
      "CollateralRewardPoolFactory",
      [CollateralController, tokenAddress]
    );

    return { CollateralController, CollateralRewardPoolFactory };
  }
);

export default RewardPoolFactoryWithExistingControllerModule;
