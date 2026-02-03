// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultOverview} from "../../structs/VaultOverview.sol";

interface IVaultStates {
    /**
     * @notice Returns an overview of the vault
     */
    function vaultOverview() external view returns (VaultOverview memory);
}
