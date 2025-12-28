// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IController6022States {
    function vaultDescriptor() external view returns (address);

    function allVaultsLength() external view returns (uint);

    function allVaults(uint) external view returns (address);

    function allRewardPoolsLength() external view returns (uint);

    function allRewardPools(uint) external view returns (address);
}
