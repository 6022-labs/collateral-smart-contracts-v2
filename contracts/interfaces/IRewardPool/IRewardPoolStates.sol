// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IRewardPoolStates {
    function creator() external view returns (address);

    function controller() external view returns (address);

    function FEES_PERCENT() external view returns (uint8);

    function allVaultsLength() external view returns (uint);

    function countRewardableVaults() external view returns (uint256);

    function collectedRewards(address) external view returns (uint256);

    function vaultsRewardWeight(address) external view returns (uint256);
}
