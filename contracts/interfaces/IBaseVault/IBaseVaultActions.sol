// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IBaseVaultEvents} from "./IBaseVaultEvents.sol";
import {IBaseVaultErrors} from "./IBaseVaultErrors.sol";

interface IBaseVaultActions {
    /**
     * @notice Deposits the collateral into the vault.
     */
    function deposit() external;

    /**
     * @notice Withdraw the collateral from the vault.
     */
    function withdraw() external;
}
