// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultOverview} from "../../structs/VaultOverview.sol";

interface ICollateralVaultStates {
    /**
     * @notice Returns the vault image (IPFS hash/path).
     */
    function image() external view returns (string memory);

    /**
     * @notice Returns an overview of the vault
     */
    function vaultOverview() external view returns (VaultOverview memory);
}
