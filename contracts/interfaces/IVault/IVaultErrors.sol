// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVaultErrors {
    /// @dev Error when user tries to deposit after the lockedUntil timestamp
    error TooLateToDeposit();

    /// @dev Error when trying to deposit without enough NFTs
    error NotEnoughNFTToDeposit();

    /// @dev Error when trying to withdraw without enough NFTs
    error NotEnoughNFTToWithdraw();
}
