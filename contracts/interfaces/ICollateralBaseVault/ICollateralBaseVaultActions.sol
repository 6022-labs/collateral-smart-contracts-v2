// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralBaseVaultEvents} from "./ICollateralBaseVaultEvents.sol";
import {ICollateralBaseVaultErrors} from "./ICollateralBaseVaultErrors.sol";

interface ICollateralBaseVaultActions {
    /**
     * @notice Deposits the collateral into the vault.
     */
    function deposit() external;

    /**
     * @notice Withdraw the collateral from the vault.
     */
    function withdraw() external;
}
