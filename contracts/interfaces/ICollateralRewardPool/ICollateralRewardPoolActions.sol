// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultStorageEnum} from "../../enums/VaultStorageEnum.sol";

interface ICollateralRewardPoolActions {
    function createVault(
        string memory _name,
        uint256 _lockedUntil,
        uint256 _wantedAmount,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType,
        uint256 _backedValueProtocolToken
    ) external;
}
