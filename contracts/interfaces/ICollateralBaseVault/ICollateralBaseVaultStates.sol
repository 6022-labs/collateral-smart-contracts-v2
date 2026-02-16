// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICollateralBaseVaultEvents} from "./ICollateralBaseVaultEvents.sol";
import {ICollateralBaseVaultErrors} from "./ICollateralBaseVaultErrors.sol";

interface ICollateralBaseVaultStates {
    /**
     * @notice Returns a boolean indicating if the vault is deposited.
     */
    function isDeposited() external view returns (bool);

    /**
     * @notice Returns a boolean indicating if the vault is withdrawn.
     */
    function isWithdrawn() external view returns (bool);

    /**
     * @notice Returns a boolean indicating if the vault is rewardable.
     */
    function isRewardable() external view returns (bool);

    /**
     * @notice Returns the reward pool address.
     */
    function rewardPool() external view returns (address);

    /**
     * @notice Returns the wanted deposit amount.
     */
    function wantedAmount() external view returns (uint256);
}
