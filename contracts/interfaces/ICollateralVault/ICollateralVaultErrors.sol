// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralVaultErrors {
    /// @dev Error when user tries to deposit after the lockedUntil timestamp
    error TooLateToDeposit();

    /// @dev Error when trying to deposit without enough NFTs
    error NotEnoughNFTToDeposit();

    /// @dev Error when trying to withdraw without enough NFTs
    error NotEnoughNFTToWithdraw();

    /// @dev Error when one of the fee percent is above the precision limit
    error InvalidFeePercent(string feeName, uint256 feePercent);

    /// @dev Error when trying to configure fees on a ERC721 collateral vault
    error FeesNotSupportedForERC721Collateral();
}
