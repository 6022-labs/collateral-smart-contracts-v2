// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVault6022 {
    /**
     * @notice Deposits the ERC20/ERC721 token
     */
    function deposit() external;

    /**
     * @notice Withdraws the ERC20/ERC721 token and harvests/reinvests the rewards
     */
    function withdraw() external;

    /**
     * @notice Returns a boolean indicating if the vault is rewardable
     */
    function isRewardable() external view returns (bool);

    /**
     * @notice Returns the number of required NFTs to being able to withdraw
     */
    function getRequiredNftsToWithdraw() external view returns (uint256);
}