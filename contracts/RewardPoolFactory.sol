// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RewardPool} from "./RewardPool.sol";
import {IControllerHelpers} from "./interfaces/IController/IControllerHelpers.sol";
import {IRewardPoolFactory} from "./interfaces/IRewardPoolFactory/IRewardPoolFactory.sol";
import {IControllerRewardPoolFactoryActions} from "./interfaces/IController/IControllerRewardPoolFactoryActions.sol";

/**
 * @title Reward Pool Factory 6022
 * @author 6022
 * @notice This contract is used to create reward pools.
 */
contract RewardPoolFactory is IRewardPoolFactory {
    // ----------------- VARIABLES ----------------- //
    /// @notice Controller 6022 address
    address public controller;

    /// @notice Protocol token address
    IERC20 public protocolTokenAddress;

    constructor(address _controllerAddress, address _protocolTokenAddress) {
        controller = _controllerAddress;
        protocolTokenAddress = IERC20(_protocolTokenAddress);
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyWhenSenderDoesNotHaveRewardPool() {
        address[] memory alreadyCreatedRewardPools = IControllerHelpers(controller)
            .getRewardPoolsByCreator(msg.sender);

        if (alreadyCreatedRewardPools.length > 0) {
            revert AlreadyCreatedRewardPool();
        }

        _;
    }

    // ----------------- FUNCS ----------------- //
    function createRewardPool(
        uint256 _lifetimeVaultAmount
    ) external onlyWhenSenderDoesNotHaveRewardPool {
        RewardPool rewardPool = new RewardPool(
            msg.sender,
            controller,
            address(protocolTokenAddress)
        );

        rewardPool.createLifetimeVault(_lifetimeVaultAmount);

        protocolTokenAddress.transferFrom(
            msg.sender,
            address(rewardPool),
            _lifetimeVaultAmount
        );
        rewardPool.depositToLifetimeVault();

        IControllerRewardPoolFactoryActions(controller).pushRewardPool(address(rewardPool));
        emit RewardPoolCreated(address(rewardPool));
    }
}
