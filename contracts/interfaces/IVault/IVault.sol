// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVaultStates} from "./IVaultStates.sol";
import {IVaultErrors} from "./IVaultErrors.sol";
import {IVaultHelpers} from "./IVaultHelpers.sol";

import {VaultOverview} from "../../structs/VaultOverview.sol";
import {IBaseVault} from "../IBaseVault/IBaseVault.sol";

interface IVault is
    IBaseVault,
    IVaultStates,
    IVaultErrors,
    IVaultHelpers
{
}
