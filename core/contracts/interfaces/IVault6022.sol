// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVault6022 {
    /**
     * @notice Deposits the ERC20 token
     */
    function deposit() external;

    /**
     * @notice Withdraws the ERC20 token
     */
    function withdraw() external;

    /**
     * @notice Returns the number of required NFTs to being able to withdraw
     */
    function getRequiredNftsToWithdraw() external view returns (uint256);
}