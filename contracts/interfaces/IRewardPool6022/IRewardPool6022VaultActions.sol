// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardPool6022VaultActions {
    function reinvestRewards() external;

    function harvestRewards(address to) external;
}
