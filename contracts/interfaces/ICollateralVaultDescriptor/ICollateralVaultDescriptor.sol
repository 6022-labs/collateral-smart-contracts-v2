// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralVaultDescriptorEvents} from "./ICollateralVaultDescriptorEvents.sol";
import {ICollateralVaultDescriptorErrors} from "./ICollateralVaultDescriptorErrors.sol";
import {ICollateralVaultDescriptorActions} from "./ICollateralVaultDescriptorActions.sol";
import {ICollateralVaultDescriptorModeratorActions} from "./ICollateralVaultDescriptorModeratorActions.sol";

interface ICollateralVaultDescriptor is
    ICollateralVaultDescriptorEvents,
    ICollateralVaultDescriptorErrors,
    ICollateralVaultDescriptorActions,
    ICollateralVaultDescriptorModeratorActions
{
}
