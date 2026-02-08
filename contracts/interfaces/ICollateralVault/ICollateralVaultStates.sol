// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultOverview} from "../../structs/VaultOverview.sol";

interface ICollateralVaultStates {
    /**
     * @notice Returns the vault image (IPFS hash/path).
     */
    function image() external view returns (string memory);

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

    /**
     * @notice Returns an overview of the vault (compatibility with V1 vaults)
     */
    function vaultOverview() external view returns (VaultOverview memory);
}
