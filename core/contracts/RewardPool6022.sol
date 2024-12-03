// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Vault6022} from "./Vault6022.sol";
import {VaultStorageEnum} from "./VaultStorageEnum.sol";
import {IRewardPool6022} from "./interfaces/IRewardPool6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RewardPoolLifetimeVault6022} from "./RewardPoolLifetimeVault6022.sol";

/**
 * @title Reward Pool
 * @author 6022
 * @notice This contract is created by a Factory contract.
 * It is used to manage a pool of vaults and distribute rewards to them.
 * Only the creator of the pool can create vaults and thus pay the fees.
 */
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

    /// @notice Lifetime vault
    RewardPoolLifetimeVault6022 public lifetimeVault;

    /// @notice Mapping of all vaults
    mapping(address => bool) public isVault;

    /// @notice Mapping of all collected rewards
    mapping(address => uint256) public collectedRewards;

    /// @notice Mapping of all vault weight in the reward mechanism
    mapping(address => uint256) public vaultsRewardWeight;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when a vault rewards are harvested
    event Harvested(address vault, uint256 value);

    /// @dev Emitted when a vault rewards are reinvested
    event Reinvested(address vault, uint256 value);

    /// @dev Emitted when a vault is pushed
    event VaultCreated(address vault);

    /// @dev Emitted when the reward pool is closed
    event RewardPoolClosed();

    // ----------------- ERRORS ----------------- //
    /// @dev Thrown when caller is not a vault from this reward pool
    error CallerNotVault();

    /// @dev Thrown when the lifetime vault is already created
    error LifeTimeVaultAlreadyExist();

    /// @dev Thrown when the lifetime vault is not created
    error LifeTimeVaultDoesNotExist();

    /// @dev Thrown when the lifetime vault is not rewardable
    error LifeTimeVaultIsNotRewardable();

    /// @dev Thrown when there is still remaining rewardable vaults while trying to close the pool
    error RemainingRewardableVaults();

    constructor(
        address _owner,
        address _controllerAddress,
        address _protocolTokenAddress
    ) Ownable(_owner) {
        protocolToken = IERC20(_protocolTokenAddress);
        controller = IController6022(_controllerAddress);
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyVault() {
        if (!isVault[msg.sender]) revert CallerNotVault();
        _;
    }

    modifier onlyWhenLifetimeVaultDoesNotExist() {
        if (address(lifetimeVault) != address(0)) revert LifeTimeVaultAlreadyExist();
        _;
    }

    modifier onlyWhenLifetimeVaultExist() {
        if (address(lifetimeVault) == address(0)) revert LifeTimeVaultDoesNotExist();
        _;
    }

    modifier onlyWhenLifetimeVaultIsRewardable() {
        if (!lifetimeVault.isRewardable()) revert LifeTimeVaultIsNotRewardable();
        _;
    }

    // ----------------- FUNCS ----------------- //
    function creator() external view override returns (address) {
        return owner();
    }

    function allVaultsLength() external view returns (uint) {
        return allVaults.length;
    }

    /// @notice This method will create the lifetime vault and deposit the protocol token in it. It will allow to create standard vaults.
    function createLifetimeVault(uint256 _lifetimeVaultAmount) external onlyWhenLifetimeVaultDoesNotExist {
        lifetimeVault = new RewardPoolLifetimeVault6022(
            address(this),
            _lifetimeVaultAmount,
            address(protocolToken)
        );

        protocolToken.approve(address(lifetimeVault), _lifetimeVaultAmount);
        lifetimeVault.deposit();

        allVaults.push(address(lifetimeVault));
        vaultsRewardWeight[address(lifetimeVault)] += _lifetimeVaultAmount;

        emit VaultCreated(address(lifetimeVault));
    }

    /// @notice This method will withdraw the lifetime vault and thus "close" the reward pool. No more vaults can be created.
    function closeAndCollectLifetimeVault() external onlyOwner {
        if (_countRewardableVaults() != 0) {
            revert RemainingRewardableVaults();
        }

        lifetimeVault.withdraw();

        // Didn't need to call the "harvestRewards" method
        // The method "transfer" will transfer all remaining funds to the caller (avoiding dust)
        protocolToken.transfer(msg.sender, protocolToken.balanceOf(address(this)));
        collectedRewards[address(lifetimeVault)] = 0;

        emit RewardPoolClosed();
    }

    function createVault(
        string memory _name,
        uint256 _lockedUntil,
        uint256 _wantedAmount,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType,
        uint256 _backedValueProtocolToken
    ) public onlyOwner onlyWhenLifetimeVaultExist onlyWhenLifetimeVaultIsRewardable {
        uint256 _protocolTokenFees = (_backedValueProtocolToken * FEES_PERCENT) / 100;

        // Here there is at least the lifetime vault that will be able to take the rewards (onlyWhenLifetimeVaultIsRewardable)
        // The lifetime vault is own by the owner of this smart contract indirectly
        // And only the owner can create a vault (and thus pay fees)
        // So the fees that pay the owner will finally go back to him (in case of only the lifetime vault)
        protocolToken.transferFrom(msg.sender, address(this), _protocolTokenFees);
        _updateRewards(_protocolTokenFees);

        Vault6022 vault = new Vault6022(
            msg.sender, 
            _name,
            _lockedUntil,
            _wantedAmount,
            address(this),
            _wantedTokenAddress,
            _storageType
        );

        allVaults.push(address(vault));
        isVault[address(vault)] = true;
        vaultsRewardWeight[address(vault)] += _protocolTokenFees;

        controller.pushVault(address(vault));

        emit VaultCreated(address(vault));
    }

    function harvestRewards(address to) external onlyVault {
        uint256 valueToHarvest = collectedRewards[msg.sender];
        collectedRewards[msg.sender] = 0;

        protocolToken.transfer(to, valueToHarvest);

        emit Harvested(msg.sender, valueToHarvest);
    }

    function reinvestRewards() external onlyVault {
        uint256 valueToReinvest = collectedRewards[msg.sender];
        collectedRewards[msg.sender] = 0;

        _updateRewards(valueToReinvest);

        emit Reinvested(msg.sender, valueToReinvest);
    }

    function _updateRewards(uint256 amount) internal {
        uint256 totalRewardableRewardWeight = _totalRewardableRewardWeight();

        if (totalRewardableRewardWeight == 0) return; // No vaults to reward and avoid division by zero

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.isRewardable()) {
                collectedRewards[address(vault)] += amount * vaultsRewardWeight[address(vault)] / totalRewardableRewardWeight;
            }
        }
    }

    function _totalRewardableRewardWeight() internal view returns (uint256) {
        uint256 totalRewardableRewardWeight = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.isRewardable()) {
                totalRewardableRewardWeight += vaultsRewardWeight[address(vault)];
            }
        }

        return totalRewardableRewardWeight;
    }

    function _countRewardableVaults() internal view returns (uint256) {
        uint256 count = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            Vault6022 vault = Vault6022(allVaults[i]);
            if (vault.isRewardable()) {
                count++;
            }
        }

        return count;
    }
}