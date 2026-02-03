// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVaultHelpers {
    /**
     * @notice Returns the number of required NFTs to being able to withdraw
     */
    function getRequiredNftsToWithdraw() external view returns (uint256);
}
