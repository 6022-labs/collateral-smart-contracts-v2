// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IControllerEvents} from "./IControllerEvents.sol";
import {IControllerErrors} from "./IControllerErrors.sol";
import {IControllerStates} from "./IControllerStates.sol";
import {IControllerHelpers} from "./IControllerHelpers.sol";
import {IControllerModeratorActions} from "./IControllerModeratorActions.sol";
import {IControllerRewardPoolActions} from "./IControllerRewardPoolActions.sol";
import {IControllerRewardPoolFactoryActions} from "./IControllerRewardPoolFactoryActions.sol";

interface IController is
    IControllerEvents,
    IControllerErrors,
    IControllerStates,
    IControllerHelpers,
    IControllerModeratorActions,
    IControllerRewardPoolActions,
    IControllerRewardPoolFactoryActions
{
}
