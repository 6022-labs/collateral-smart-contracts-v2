// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ITokenOperation {
    function approve(address, uint256) external;

    function transferFrom(address, address, uint256) external;

    function balanceOf(address) external view returns (uint256);
}
