// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VaultStorageEnum} from "../VaultStorageEnum.sol";

interface IRewardPool6022 {
    function reinvestRewards() external;

    function harvestRewards(address to) external;
    
    function createVault(
        string memory _name, 
        uint256 _lockedUntil, 
        uint256 _wantedAmount,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType,
        uint256 _backedValueProtocolToken) external;

    function creator() external view returns (address);

    function FEES_PERCENT() external view returns (uint8);

    function allVaultsLength() external view returns (uint);

    function collectedFees(address) external view returns (uint256);

    function collectedRewards(address) external view returns (uint256);
}