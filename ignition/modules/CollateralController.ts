// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import VaultDescriptorModule from "./CollateralVaultDescriptor";

const ControllerModule = buildModule("CollateralController", (m) => {
  const { CollateralVaultDescriptor } = m.useModule(VaultDescriptorModule);

  const CollateralController = m.contract("CollateralController", [], {
    after: [CollateralVaultDescriptor],
  });

  m.call(
    CollateralController,
    "updateVaultDescriptor",
    [CollateralVaultDescriptor],
    {
      after: [CollateralController, CollateralVaultDescriptor],
    }
  );

  return { CollateralController };
});

export default ControllerModule;
