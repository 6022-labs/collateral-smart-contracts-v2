// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IBaseVault6022} from "./interfaces/IBaseVault6022/IBaseVault6022.sol";

/**
 * @title Base Vault 6022
 * @author 6022
 * @notice This contract is a abstract contract for RewardPoolLifetimeVault6022 and Vault6022.
 */
abstract contract BaseVault6022 is IBaseVault6022 {
    // ----------------- VARIABLES ----------------- //
    /// @notice Indicates if the contract is deposited
    bool public isDeposited;

    /// @notice Indicates if the contract is withdrawn
    bool public isWithdrawn;

    /// @notice Amount wanted in the deposit of the protocol token
    uint256 public wantedAmount;

    /// @notice Reward pool
    address public rewardPool;

    constructor(address _rewardPool, uint256 _wantedAmount) {
        isDeposited = false;
        isWithdrawn = false;

        rewardPool = _rewardPool;
        wantedAmount = _wantedAmount;
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyWhenDeposited() {
        if (!isDeposited) {
            revert NotDeposited();
        }
        _;
    }

    modifier onlyWhenNotDeposited() {
        if (isDeposited) {
            revert AlreadyDeposited();
        }
        _;
    }

    modifier onlyWhenNotWithdrawn() {
        if (isWithdrawn) {
            revert AlreadyWithdrawn();
        }
        _;
    }
}
