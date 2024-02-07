// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IController6022 {
    function pushVault(address _vault) external;

    function allVaultsLength() external view returns (uint);
    
    function allVaults() external view returns (address[] memory);

    function rewardsPools(address) external view returns (address);
    
    function allRewardPools() external view returns (address[] memory);

    function pushRewardPool(address _rewardPool, address _creator) external;
}