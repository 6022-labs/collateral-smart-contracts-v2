// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralControllerEvents} from "./ICollateralControllerEvents.sol";
import {ICollateralControllerErrors} from "./ICollateralControllerErrors.sol";
import {ICollateralControllerStates} from "./ICollateralControllerStates.sol";
import {ICollateralControllerHelpers} from "./ICollateralControllerHelpers.sol";
import {ICollateralControllerModeratorActions} from "./ICollateralControllerModeratorActions.sol";
import {ICollateralControllerRewardPoolActions} from "./ICollateralControllerRewardPoolActions.sol";
import {ICollateralControllerRewardPoolFactoryActions} from "./ICollateralControllerRewardPoolFactoryActions.sol";

interface ICollateralController is
    ICollateralControllerEvents,
    ICollateralControllerErrors,
    ICollateralControllerStates,
    ICollateralControllerHelpers,
    ICollateralControllerModeratorActions,
    ICollateralControllerRewardPoolActions,
    ICollateralControllerRewardPoolFactoryActions
{
}
