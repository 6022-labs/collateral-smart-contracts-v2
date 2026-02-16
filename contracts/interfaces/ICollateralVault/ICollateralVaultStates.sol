// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultStorageEnum} from "../../enums/VaultStorageEnum.sol";

interface ICollateralVaultStates {
    /**
     * @notice Returns the max number of NFTs in the vault.
     */
    function MAX_TOKENS() external view returns (uint256);

    /**
     * @notice Returns the number of NFTs required to withdraw early.
     */
    function WITHDRAW_NFTS_EARLY() external view returns (uint256);

    /**
     * @notice Returns the number of NFTs required to withdraw after lock expires.
     */
    function WITHDRAW_NFTS_LATE() external view returns (uint256);

    /**
     * @notice Returns the fee precision (100_000 = 100%).
     */
    function FEES_PERCENT_PRECISION() external view returns (uint256);

    /**
     * @notice Returns the vault creator.
     */
    function creator() external view returns (address);

    /**
     * @notice Returns the lock expiration timestamp.
     */
    function lockedUntil() external view returns (uint256);

    /**
     * @notice Returns the vault image (IPFS hash/path).
     */
    function image() external view returns (string memory);

    /**
     * @notice Returns the deposit timestamp.
     */
    function depositTimestamp() external view returns (uint256);

    /**
     * @notice Returns the withdraw timestamp.
     */
    function withdrawTimestamp() external view returns (uint256);

    /**
     * @notice Returns the creation timestamp.
     */
    function creationTimestamp() external view returns (uint256);

    /**
     * @notice Returns the wanted token address.
     */
    function wantedTokenAddress() external view returns (address);

    /**
     * @notice Returns the vault storage type.
     */
    function storageType() external view returns (VaultStorageEnum);

    /**
     * @notice Returns the number of NFTs required to withdraw.
     */
    function getRequiredNftsToWithdraw() external view returns (uint256);

    /**
     * @notice Returns the deposit fee percent (100_000 = 100%)
     */
    function depositFeePercent() external view returns (uint256);

    /**
     * @notice Returns the withdraw early fee percent (100_000 = 100%)
     */
    function withdrawEarlyFeePercent() external view returns (uint256);

    /**
     * @notice Returns the withdraw late fee percent (100_000 = 100%)
     */
    function withdrawLateFeePercent() external view returns (uint256);

    /**
     * @notice Returns the fee beneficiary
     */
    function feeBeneficiary() external view returns (address);
}
