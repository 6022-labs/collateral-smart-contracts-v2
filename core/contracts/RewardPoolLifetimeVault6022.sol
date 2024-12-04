// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseVault6022} from "./BaseVault6022.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Reward Pool Lifetime Vault
 * @author 6022
 * @notice This contract is only created at a reward pool creation.
 * It will be used as a default vault for the rewards in case there is no rewardable vault in the pool.
 * The collateral and the rewards for this contract are owned by the creator of the reward pool.
 */
contract RewardPoolLifetimeVault6022 is BaseVault6022 {
    // ----------------- VARIABLES ----------------- //
    /// @notice Contract of the protocol token
    IERC20 public protocolToken;

    // ----------------- VARIABLES ----------------- //
    /// @notice Error when the caller is not the reward pool
    error CallerNotRewardPool();

    constructor(
        address _rewardPool,
        uint256 _wantedAmount,
        address _protocolToken
    ) BaseVault6022(_rewardPool, _wantedAmount) {
        isDeposited = false;
        isWithdrawn = false;

        protocolToken = IERC20(_protocolToken);
    }

    modifier onlyRewardPool() {
        if (msg.sender != address(rewardPool)) {
            revert CallerNotRewardPool();
        }
        _;
    }

    function deposit() external override onlyRewardPool onlyWhenNotDeposited {
        protocolToken.transferFrom(msg.sender, address(this), wantedAmount);

        isDeposited = true;
        emit Deposited(msg.sender, wantedAmount);
    }

    function withdraw() external override onlyRewardPool onlyWhenDeposited onlyWhenNotWithdrawn {
        protocolToken.transfer(msg.sender, wantedAmount);

        // Didn't need to call the "harvestRewards" method from the RewardPool6022
        // The method closeAndCollectLifetimeVault will transfer all remaining funds in the RewardPool to the caller
         
        isWithdrawn = true;
        emit Withdrawn(msg.sender, wantedAmount);
    }

    function isRewardable() external view override returns (bool) {
        return isDeposited && !isWithdrawn;
    }
}