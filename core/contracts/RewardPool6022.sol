// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {Vault6022} from "./Vault6022.sol";
import {IRewardPool6022} from "./interfaces/IRewardPool6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RewardPool6022 is Ownable, IRewardPool6022 {
    // ----------------- CONST ----------------- //
    uint8 public constant FEES_PERCENT = 10;

    // ----------------- VARIABLES ----------------- //
    /// @notice List of all vaults related to this reward pool
    address[] public allVaults;

    /// @notice Protocol token
    IERC20 public protocolToken;

    /// @notice Controller 6022
    IController6022 public controller;

    /// @notice Mapping of all vaults
    mapping(address => bool) public isVault;

    /// @notice Mapping of all rewards
    mapping(address => uint256) public rewards;

    /// @notice Mapping of all recolted fees
    mapping(address => uint256) public recoltedFees;

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
    function allVaultsLength() external view returns (uint) {
        return allVaults.length;
    }
    
    function createVault(
        string memory _name, 
        uint256 _lockedUntil, 
        uint256 _wantedAmount,
        address _wantedTokenAddress, 
        uint256 _backedValueProtocolToken) public onlyOwner {

        uint256 _protocolTokenFees = _backedValueProtocolToken / FEES_PERCENT;
        
        if (allVaults.length > 0) {
            protocolToken.transferFrom(msg.sender, address(this), _protocolTokenFees);
            _updateRewards(_protocolTokenFees);
        }

        Vault6022 vault = new Vault6022(
            msg.sender, 
            _name,
            _lockedUntil,
            _wantedAmount,
            address(this),
            _wantedTokenAddress);

        allVaults.push(address(vault));
        isVault[address(vault)] = true;
        recoltedFees[address(vault)] += _protocolTokenFees;

        controller.pushVault(address(vault));

        emit VaultCreated(address(vault));
    }

    function harvestRewards(address to) external onlyVault {
        uint256 valueToHarvest = rewards[msg.sender];
        rewards[msg.sender] = 0;

        protocolToken.transfer(to, valueToHarvest);

        emit Harvested(msg.sender);
    }

    function reinvestRewards() external onlyVault {
        uint256 valueToReinvest = rewards[msg.sender];
        rewards[msg.sender] = 0;

        _updateRewards(valueToReinvest);

        emit Reinvested(msg.sender);
    }

    function _updateRewards(uint256 amount) internal {
        uint256 totalRewardableVaults = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.lockedUntil() > block.timestamp && vault.isDeposited() && !vault.isWithdrawn()) {
                totalRewardableVaults += recoltedFees[address(vault)];
            }
        }

        if (totalRewardableVaults == 0) return; // No vaults to reward and avoid division by zero

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.lockedUntil() > block.timestamp && vault.isDeposited() && !vault.isWithdrawn()) {
                rewards[address(vault)] += amount * recoltedFees[address(vault)] / totalRewardableVaults;
            }
        }
    }
}