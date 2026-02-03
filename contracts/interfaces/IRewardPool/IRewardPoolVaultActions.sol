// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardPoolVaultActions {
    function reinvestRewards() external;

    function harvestRewards(address to) external;
}
