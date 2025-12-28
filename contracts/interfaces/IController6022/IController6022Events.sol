// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IController6022Events {
    /// @dev Emitted when a vault is pushed
    event VaultPushed(address vault);

    /// @dev Emitted when a admin is added
    event AdminAdded(address account);

    /// @dev Emitted when a admin is removed
    event AdminRemoved(address account);

    /// @dev Emitted when a factory is added
    event FactoryAdded(address account);

    /// @dev Emitted when a factory is removed
    event FactoryRemoved(address account);

    /// @dev Emitted when a reward pool is pushed
    event RewardPoolPushed(address rewardPool);

    /// @dev Emitted when the vault descriptor is updated
    event VaultDescriptorUpdated(address vaultDescriptor);
}
