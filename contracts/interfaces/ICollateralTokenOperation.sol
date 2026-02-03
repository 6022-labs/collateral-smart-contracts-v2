// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralTokenOperation {
    function approve(address, uint256) external;

    function transferFrom(address, address, uint256) external;

    function balanceOf(address) external view returns (uint256);
}
