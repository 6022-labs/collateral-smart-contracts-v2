// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RewardPool6022} from "./RewardPool6022.sol";
import {IController6022Helpers} from "./interfaces/IController6022/IController6022Helpers.sol";
import {IRewardPoolFactory6022} from "./interfaces/IRewardPoolFactory6022/IRewardPoolFactory6022.sol";
import {IController6022RewardPoolFactoryActions} from "./interfaces/IController6022/IController6022RewardPoolFactoryActions.sol";

/**
 * @title Reward Pool Factory 6022
 * @author 6022
 * @notice This contract is used to create reward pools.
 */
contract RewardPoolFactory6022 is IRewardPoolFactory6022 {
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
        address[] memory alreadyCreatedRewardPools = IController6022Helpers(controller)
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
        RewardPool6022 rewardPool = new RewardPool6022(
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

        IController6022RewardPoolFactoryActions(controller).pushRewardPool(address(rewardPool));
        emit RewardPoolCreated(address(rewardPool));
    }
}
