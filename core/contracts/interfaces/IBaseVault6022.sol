// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBaseVault6022 {
    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when the contract is deposited
    event Deposited(address depositor, uint256 amount);

    /// @dev Emitted when the contract is withdrawn
    event Withdrawn(address withdrawer, uint256 amount);

    // ----------------- ERRORS ----------------- //
    /// @dev Error when the contract is already deposited
    error AlreadyDeposited();

    /// @dev Error when the contract is already withdrawn
    error AlreadyWithdraw();

    /// @dev Error when the contract is not deposited
    error NotDeposited();

    // ----------------- FUNCS ----------------- //
    /**
     * @notice Deposits the collateral into the vault.
     */
    function deposit() external;

    /**
     * @notice Withdraw the collateral from the vault.
     */
    function withdraw() external;

    /**
     * @notice Returns a boolean indicating if the vault is deposited.
     */
    function isDeposited() external view returns (bool);

    /**
     * @notice Returns a boolean indicating if the vault is withdrawn.
     */
    function isWithdrawn() external view returns (bool);

    /**
     * @notice Returns a boolean indicating if the vault is rewardable.
     */
    function isRewardable() external view returns (bool);
}