// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IBaseVault6022Events} from "./IBaseVault6022Events.sol";
import {IBaseVault6022Errors} from "./IBaseVault6022Errors.sol";

interface IBaseVault6022Actions {
    /**
     * @notice Deposits the collateral into the vault.
     */
    function deposit() external;

    /**
     * @notice Withdraw the collateral from the vault.
     */
    function withdraw() external;
}
