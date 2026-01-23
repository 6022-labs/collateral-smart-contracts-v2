// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IBaseVault6022Events} from "./IBaseVault6022Events.sol";
import {IBaseVault6022Errors} from "./IBaseVault6022Errors.sol";

interface IBaseVault6022States {
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
}
