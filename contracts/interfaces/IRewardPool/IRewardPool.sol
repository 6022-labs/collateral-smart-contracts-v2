// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRewardPoolStates} from "./IRewardPoolStates.sol";
import {IRewardPoolErrors} from "./IRewardPoolErrors.sol";
import {IRewardPoolEvents} from "./IRewardPoolEvents.sol";
import {IRewardPoolActions} from "./IRewardPoolActions.sol";
import {IRewardPoolVaultActions} from "./IRewardPoolVaultActions.sol";

interface IRewardPool is
    IRewardPoolStates,
    IRewardPoolErrors,
    IRewardPoolEvents,
    IRewardPoolActions,
    IRewardPoolVaultActions
{
}
