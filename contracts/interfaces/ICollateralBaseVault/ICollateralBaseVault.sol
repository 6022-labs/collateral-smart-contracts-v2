// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralBaseVaultEvents} from "./ICollateralBaseVaultEvents.sol";
import {ICollateralBaseVaultErrors} from "./ICollateralBaseVaultErrors.sol";
import {ICollateralBaseVaultStates} from "./ICollateralBaseVaultStates.sol";
import {ICollateralBaseVaultActions} from "./ICollateralBaseVaultActions.sol";

interface ICollateralBaseVault is
    ICollateralBaseVaultEvents,
    ICollateralBaseVaultErrors,
    ICollateralBaseVaultStates,
    ICollateralBaseVaultActions
{
}
