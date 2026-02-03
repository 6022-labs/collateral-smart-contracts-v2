// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardPoolLifetimeVaultErrors {
    /// @dev Thrown when there is still remaining rewardable vaults while trying to close the pool
    error RemainingRewardableVaults();
}
