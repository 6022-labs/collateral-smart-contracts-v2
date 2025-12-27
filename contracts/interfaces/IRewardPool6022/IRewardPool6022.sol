// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IRewardPool6022States} from "./IRewardPool6022States.sol";
import {IRewardPool6022Actions} from "./IRewardPool6022Actions.sol";
import {IRewardPool6022VaultActions} from "./IRewardPool6022VaultActions.sol";

interface IRewardPool6022 is
    IRewardPool6022States,
    IRewardPool6022Actions,
    IRewardPool6022VaultActions
{
    function reinvestRewards() external;

    function harvestRewards(address to) external;
}
