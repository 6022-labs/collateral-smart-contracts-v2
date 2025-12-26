// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {VaultStorageEnum} from "../enums/VaultStorageEnum.sol";

struct VaultOverview {
    string name;
    address creator;
    bool isDeposited;
    bool isWithdrawn;
    uint256 lockedUntil;
    uint256 wantedAmount;
    uint256 rewardWeight;
    uint256 collectedRewards;
    string wantedTokenSymbol;
    uint256 depositTimestamp;
    uint8 wantedTokenDecimals;
    uint256 withdrawTimestamp;
    uint256 creationTimestamp;
    address rewardPoolAddress;
    address wantedTokenAddress;
    uint256 balanceOfWantedToken;
    VaultStorageEnum storageType;
    uint256 backedValueProtocolToken;
}