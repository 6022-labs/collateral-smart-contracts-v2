// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RewardPool6022} from "./RewardPool6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {IRewardPoolFactory6022} from "./interfaces/IRewardPoolFactory6022.sol";

contract RewardPoolFactory6022 is IRewardPoolFactory6022 {
    // ----------------- VARIABLES ----------------- //
    /// @notice Controller 6022 address
    IController6022 public controller;

    /// @notice Protocol token address
    address public protocolTokenAddress;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when a new vault is created
    event RewardPoolCreated(address rewardPool);

    // ----------------- ERRORS ----------------- //
    /// @dev Error when the caller has already created a reward pool
    error AlreadyCreatedRewardPool();

    constructor(address _controllerAddress, address _protocolTokenAddress) {
        protocolTokenAddress = _protocolTokenAddress;
        controller = IController6022(_controllerAddress);
    }

    function createRewardPool() external {
        address[] memory alreadyCreatedRewardPools = controller.getRewardPoolsByCreator(msg.sender);

        if (alreadyCreatedRewardPools.length > 0) {
            revert AlreadyCreatedRewardPool();
        }

        RewardPool6022 rewardPool = new RewardPool6022(
            msg.sender,
            address(controller), 
            protocolTokenAddress);
        
        controller.pushRewardPool(address(rewardPool));
        emit RewardPoolCreated(address(rewardPool));
    }
}