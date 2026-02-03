// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralBaseVaultEvents {
    /// @dev Emitted when the contract is deposited
    event Deposited(address depositor, uint256 amount);

    /// @dev Emitted when the contract is withdrawn
    event Withdrawn(address withdrawer, uint256 amount);
}
