// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultOverview} from "../structs/VaultOverview.sol";
import {IBaseVault6022} from "./IBaseVault6022.sol";

interface IVault6022 is IBaseVault6022 {
    /**
     * @notice Returns the number of required NFTs to being able to withdraw
     */
    function getRequiredNftsToWithdraw() external view returns (uint256);

    /**
     * @notice Returns an overview of the vault
     */
    function vaultOverview() external view returns (VaultOverview memory);
}
