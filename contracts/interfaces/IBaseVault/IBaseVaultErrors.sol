// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBaseVaultErrors{
    /// @dev Error when the contract is already deposited
    error AlreadyDeposited();

    /// @dev Error when the contract is already withdrawn
    error AlreadyWithdrawn();

    /// @dev Error when the contract is not deposited
    error NotDeposited();
}
