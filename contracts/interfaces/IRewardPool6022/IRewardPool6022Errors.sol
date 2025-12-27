// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardPool6022Errors {
    /// @dev Thrown when caller is not a vault from this reward pool
    error CallerNotVault();

    /// @dev Thrown when the lifetime vault is already created
    error LifeTimeVaultAlreadyExist();

    /// @dev Thrown when the lifetime vault is not created
    error LifeTimeVaultDoesNotExist();

    /// @dev Thrown when the lifetime vault is not rewardable
    error LifeTimeVaultIsNotRewardable();

    /// @dev Thrown when the lifetime vault is rewardable
    error LifeTimeVaultIsRewardable();

    /// @dev Thrown when their is no dust to collect
    error NoDustToCollect();

    /// @dev Thrown when the given locked until is too short compared to block.timestamp
    error LockedUntilTooShort();
}
