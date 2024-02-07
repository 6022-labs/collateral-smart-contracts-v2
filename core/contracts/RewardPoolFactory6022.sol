// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RewardPool6022} from "./RewardPool6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {IRewardPoolFactory6022} from "./interfaces/IRewardPoolFactory6022.sol";

contract RewardPoolFactory6022 is IRewardPoolFactory6022 {
    // ----------------- VARIABLES ----------------- //
    /// @notice Protocol token address
    address public protocolToken;
    
    /// @notice Controller 6022 address
    IController6022 public controller;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when a new vault is created
    event RewardPoolCreated(address rewardPool);

    constructor(address _controllerAddress, address _protocolToken) {
        protocolToken = _protocolToken;
        controller = IController6022(_controllerAddress);
    }

    function createRewardPool() external {
        RewardPool6022 rewardPool = new RewardPool6022(address(controller), protocolToken);
        
        controller.pushRewardPool(address(rewardPool), msg.sender);
        emit RewardPoolCreated(address(rewardPool));
    }
}