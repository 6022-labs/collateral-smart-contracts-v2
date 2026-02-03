// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardPoolEvents {
       /// @dev Emitted when a vault rewards are harvested
    event Harvested(address vault, uint256 value);

    /// @dev Emitted when a vault rewards are reinvested
    event Reinvested(address vault, uint256 value);

    /// @dev Emitted when a vault is pushed
    event VaultCreated(address vault);

    /// @dev Emitted when dust is collected
    event DustCollected(uint256 amount);
}