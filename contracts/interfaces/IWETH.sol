// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}