// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IController6022Events} from "./IController6022Events.sol";
import {IController6022Errors} from "./IController6022Errors.sol";
import {IController6022States} from "./IController6022States.sol";
import {IController6022Helpers} from "./IController6022Helpers.sol";
import {IController6022ModeratorActions} from "./IController6022ModeratorActions.sol";
import {IController6022RewardPoolActions} from "./IController6022RewardPoolActions.sol";
import {IController6022RewardPoolFactoryActions} from "./IController6022RewardPoolFactoryActions.sol";

interface IController6022 is
    IController6022Events,
    IController6022Errors,
    IController6022States,
    IController6022Helpers,
    IController6022ModeratorActions,
    IController6022RewardPoolActions,
    IController6022RewardPoolFactoryActions
{
}
