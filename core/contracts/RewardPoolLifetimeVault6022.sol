// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseVault6022} from "./BaseVault6022.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Reward Pool Lifetime Vault
 * @author 6022
 * @notice This contract is only created at a reward pool creation.
 * It will be used as a default vault for the rewards in case there is no rewardable vault in the pool.
 * The collateral and the rewards for this contract are owned by the creator of the reward pool.
 */
contract RewardPoolLifetimeVault6022 is Ownable, BaseVault6022 {
    // ----------------- VARIABLES ----------------- //
    /// @notice Contract of the protocol token
    IERC20 public protocolToken;

    // ----------------- ERRORS ----------------- //
    /// @dev Thrown when there is still remaining rewardable vaults while trying to close the pool
    error RemainingRewardableVaults();

    constructor(
        address _owner,
        address _rewardPool,
        uint256 _wantedAmount,
        address _protocolToken
    ) Ownable(_owner) BaseVault6022(_rewardPool, _wantedAmount) {
        isDeposited = false;
        isWithdrawn = false;

        protocolToken = IERC20(_protocolToken);
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyWhenLastVaultInPool() {
        // Check if there is only one rewardable vault left (this one, because of onlyWhenNotWithdrawn)
        if (rewardPool.countRewardableVaults() != 1) revert RemainingRewardableVaults();
        _;
    }

    modifier onlyRewardPool() {
        if (address(rewardPool) != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
        _;
    }

    // ----------------- FUNCS ----------------- //
    function deposit() external override onlyRewardPool onlyWhenNotDeposited {
        protocolToken.transferFrom(msg.sender, address(this), wantedAmount);

        isDeposited = true;
        emit Deposited(_msgSender(), wantedAmount);
    }

    function withdraw()
        external
        override
        onlyOwner
        onlyWhenDeposited
        onlyWhenNotWithdrawn
        onlyWhenLastVaultInPool {

        protocolToken.transfer(_msgSender(), wantedAmount);

        rewardPool.harvestRewards(_msgSender());

        isWithdrawn = true;
        emit Withdrawn(_msgSender(), wantedAmount);
    }

    function isRewardable() external view override returns (bool) {
        return isDeposited && !isWithdrawn;
    }
}