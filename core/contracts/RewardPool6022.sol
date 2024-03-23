// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {Vault6022} from "./Vault6022.sol";
import {VaultStorageEnum} from "./VaultStorageEnum.sol";
import {IRewardPool6022} from "./interfaces/IRewardPool6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RewardPool6022 is Ownable, IRewardPool6022 {
    // ----------------- CONST ----------------- //
    uint8 public constant FEES_PERCENT = 2;

    // ----------------- VARIABLES ----------------- //
    /// @notice List of all vaults related to this reward pool
    address[] public allVaults;

    /// @notice Protocol token
    IERC20 public protocolToken;

    /// @notice Controller 6022
    IController6022 public controller;

    /// @notice Mapping of all vaults
    mapping(address => bool) public isVault;

    /// @notice Mapping of all collected fees
    mapping(address => uint256) public collectedFees;

    /// @notice Mapping of all collected rewards
    mapping(address => uint256) public collectedRewards;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when a vault rewards are harvested
    event Harvested(address vault);

    /// @dev Emitted when a vault rewards are reinvested
    event Reinvested(address vault);

    /// @dev Emitted when a vault is pushed
    event VaultCreated(address vault);

    // ----------------- ERRORS ----------------- //
    error CallerNotVault();

    constructor(
        address _creator,
        address _controllerAddress, 
        address _protocolTokenAddress) Ownable(_creator) {
        protocolToken = IERC20(_protocolTokenAddress);
        controller = IController6022(_controllerAddress);
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyVault() {
        if (!isVault[msg.sender]) revert CallerNotVault();
        _;
    }

    // ----------------- FUNCS ----------------- //
    function creator() external view override returns (address) {
        return owner();
    }

    function allVaultsLength() external view returns (uint) {
        return allVaults.length;
    }
    
    function createVault(
        string memory _name, 
        uint256 _lockedUntil, 
        uint256 _wantedAmount,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType,
        uint256 _backedValueProtocolToken) public onlyOwner {

        uint256 _protocolTokenFees = (_backedValueProtocolToken / 100) * FEES_PERCENT;
        
        if (_rewardablePools() > 0) {
            protocolToken.transferFrom(msg.sender, address(this), _protocolTokenFees);
            _updateRewards(_protocolTokenFees);
        }

        Vault6022 vault = new Vault6022(
            msg.sender, 
            _name,
            _lockedUntil,
            _wantedAmount,
            address(this),
            _wantedTokenAddress,
            _storageType);

        allVaults.push(address(vault));
        isVault[address(vault)] = true;
        collectedFees[address(vault)] += _protocolTokenFees;

        controller.pushVault(address(vault));

        emit VaultCreated(address(vault));
    }

    function harvestRewards(address to) external onlyVault {
        uint256 valueToHarvest = collectedRewards[msg.sender];
        collectedRewards[msg.sender] = 0;

        protocolToken.transfer(to, valueToHarvest);

        emit Harvested(msg.sender);
    }

    function reinvestRewards() external onlyVault {
        uint256 valueToReinvest = collectedRewards[msg.sender];
        collectedRewards[msg.sender] = 0;

        _updateRewards(valueToReinvest);

        emit Reinvested(msg.sender);
    }

    function _updateRewards(uint256 amount) internal {
        uint256 totalRewardableVaults = _rewardablePools();

        if (totalRewardableVaults == 0) return; // No vaults to reward and avoid division by zero

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.isRewardable()) {
                // If there is only one vault, it will get all the past rewards
                if (totalRewardableVaults == 1) {
                    collectedRewards[address(vault)] = protocolToken.balanceOf(address(this));
                } else {
                    collectedRewards[address(vault)] += amount * collectedFees[address(vault)] / totalRewardableVaults;
                }
            }
        }
    }

    function _rewardablePools() internal view returns (uint256) {
        uint256 totalRewardableVaults = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.isRewardable()) {
                totalRewardableVaults += collectedFees[address(vault)];
            }
        }

        return totalRewardableVaults;
    }
}