// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralRewardPoolStates} from "./ICollateralRewardPoolStates.sol";
import {ICollateralRewardPoolErrors} from "./ICollateralRewardPoolErrors.sol";
import {ICollateralRewardPoolEvents} from "./ICollateralRewardPoolEvents.sol";
import {ICollateralRewardPoolActions} from "./ICollateralRewardPoolActions.sol";
import {ICollateralRewardPoolVaultActions} from "./ICollateralRewardPoolVaultActions.sol";

interface ICollateralRewardPool is
    ICollateralRewardPoolStates,
    ICollateralRewardPoolErrors,
    ICollateralRewardPoolEvents,
    ICollateralRewardPoolActions,
    ICollateralRewardPoolVaultActions
{
}
