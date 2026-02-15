// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ControllerWithExistingDescriptorModule = buildModule(
  "CollateralControllerWithExistingDescriptor",
  (m) => {
    const collateralVaultDescriptorAddress = m.getParameter(
      "collateralVaultDescriptorAddress"
    );

    const CollateralController = m.contract("CollateralController");
    const CollateralVaultDescriptor = m.contractAt(
      "CollateralVaultDescriptor",
      collateralVaultDescriptorAddress
    );

    const updateVaultDescriptor = m.call(
      CollateralController,
      "updateVaultDescriptor",
      [CollateralVaultDescriptor],
      {
        after: [CollateralController, CollateralVaultDescriptor],
      }
    );

    return {
      CollateralController,
      CollateralVaultDescriptor,
      updateVaultDescriptor,
    };
  }
);

export default ControllerWithExistingDescriptorModule;
