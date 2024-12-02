// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IBaseVault6022} from "./interfaces/IBaseVault6022.sol";
import {IRewardPool6022} from "./interfaces/IRewardPool6022.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    IRewardPool6022 public rewardPool;

    constructor(
        address _rewardPool,
        uint256 _wantedAmount
    ) {
        isDeposited = false;
        isWithdrawn = false;

        wantedAmount = _wantedAmount;
        rewardPool = IRewardPool6022(_rewardPool);
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
            revert AlreadyWithdraw();
        }
        _;
    }
}