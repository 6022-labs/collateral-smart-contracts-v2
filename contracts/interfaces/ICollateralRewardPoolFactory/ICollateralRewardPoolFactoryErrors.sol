// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralRewardPoolFactoryErrors {
    /// @dev Error when the caller has already created a reward pool
    error AlreadyCreatedRewardPool();
}
