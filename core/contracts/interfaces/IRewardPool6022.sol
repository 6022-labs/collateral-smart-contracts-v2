// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardPool6022 {
    function createVault(
        string memory _name, 
        uint256 _lockedUntil, 
        uint256 _wantedAmount,
        address _wantedERC20Address, 
        uint256 _backedValueProtocolToken) external;

    function allVaultsLength() external view returns (uint);

    function harvestRewards(address to) external;

    function reinvestRewards() external;
}