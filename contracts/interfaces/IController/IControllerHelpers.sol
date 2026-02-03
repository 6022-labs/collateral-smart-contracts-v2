// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IControllerHelpers {
    function getRewardPoolsByCreator(address creator) external returns (address[] memory);
}
