// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IController6022 {
    function pushVault(address _vault) external;

    function pushRewardPool(address _rewardPool) external;

    function allVaultsLength() external view returns (uint);

    function allVaults(uint) external view returns (address);

    function allRewardPoolsLength() external view returns (uint);

    function allRewardPools(uint) external view returns (address);

    function getRewardPoolsByCreator(address) external view returns (address[] memory);
}