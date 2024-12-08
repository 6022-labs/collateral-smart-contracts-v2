// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RewardPool6022} from "./RewardPool6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Reward Pool Factory 6022
 * @author 6022
 * @notice This contract is used to create reward pools.
 */
contract RewardPoolFactory6022 {
    // ----------------- VARIABLES ----------------- //
    /// @notice Controller 6022 address
    IController6022 public controller;

    /// @notice Protocol token address
    IERC20 public protocolTokenAddress;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when a new vault is created
    event RewardPoolCreated(address rewardPool);

    // ----------------- ERRORS ----------------- //
    /// @dev Error when the caller has already created a reward pool
    error AlreadyCreatedRewardPool();

    constructor(address _controllerAddress, address _protocolTokenAddress) {
        controller = IController6022(_controllerAddress);
        protocolTokenAddress = IERC20(_protocolTokenAddress);
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyWhenSenderDoesNotHaveRewardPool() {
        address[] memory alreadyCreatedRewardPools = controller.getRewardPoolsByCreator(msg.sender);

        if (alreadyCreatedRewardPools.length > 0) {
            revert AlreadyCreatedRewardPool();
        }

        _;
    }

    // ----------------- FUNCS ----------------- //
    function createRewardPool(uint256 _lifetimeVaultAmount) external onlyWhenSenderDoesNotHaveRewardPool {
        RewardPool6022 rewardPool = new RewardPool6022(
            msg.sender,
            address(controller),
            address(protocolTokenAddress)
        );

        rewardPool.createLifetimeVault(_lifetimeVaultAmount);

        protocolTokenAddress.transferFrom(msg.sender, address(rewardPool), _lifetimeVaultAmount);
        rewardPool.depositToLifetimeVault();

        controller.pushRewardPool(address(rewardPool));
        emit RewardPoolCreated(address(rewardPool));
    }
}