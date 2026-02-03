// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IBaseVaultEvents} from "./IBaseVaultEvents.sol";
import {IBaseVaultErrors} from "./IBaseVaultErrors.sol";
import {IBaseVaultStates} from "./IBaseVaultStates.sol";
import {IBaseVaultActions} from "./IBaseVaultActions.sol";

interface IBaseVault is
    IBaseVaultEvents,
    IBaseVaultErrors,
    IBaseVaultStates,
    IBaseVaultActions
{
}
