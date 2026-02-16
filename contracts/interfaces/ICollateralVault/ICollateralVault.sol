// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralVaultStates} from "./ICollateralVaultStates.sol";
import {ICollateralVaultErrors} from "./ICollateralVaultErrors.sol";
import {ICollateralBaseVault} from "../ICollateralBaseVault/ICollateralBaseVault.sol";

interface ICollateralVault is
    ICollateralBaseVault,
    ICollateralVaultStates,
    ICollateralVaultErrors
{
}
