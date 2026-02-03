// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralVaultStates} from "./ICollateralVaultStates.sol";
import {ICollateralVaultErrors} from "./ICollateralVaultErrors.sol";
import {ICollateralVaultHelpers} from "./ICollateralVaultHelpers.sol";

import {VaultOverview} from "../../structs/VaultOverview.sol";
import {ICollateralBaseVault} from "../ICollateralBaseVault/ICollateralBaseVault.sol";

interface ICollateralVault is
    ICollateralBaseVault,
    ICollateralVaultStates,
    ICollateralVaultErrors,
    ICollateralVaultHelpers
{
}
