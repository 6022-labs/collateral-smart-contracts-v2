// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Vault6022} from "./Vault6022.sol";
import {VaultStorageEnum} from "./VaultStorageEnum.sol";
import {IBaseVault6022} from "./interfaces/IBaseVault6022.sol";
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

    /// @notice Lifetime vault that will act as default fee collector and serve as reward pool state.
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

    /// @dev Emitted when dust is collected
    event DustCollected(uint256 amount);

    // ----------------- ERRORS ----------------- //
    /// @dev Thrown when caller is not a vault from this reward pool
    error CallerNotVault();

    /// @dev Thrown when the lifetime vault is already created
    error LifeTimeVaultAlreadyExist();

    /// @dev Thrown when the lifetime vault is not created
    error LifeTimeVaultDoesNotExist();

    /// @dev Thrown when the lifetime vault is not rewardable
    error LifeTimeVaultIsNotRewardable();

    /// @dev Thrown when the lifetime vault is rewardable
    error LifeTimeVaultIsRewardable();

    /// @dev Thrown when their is no dust to collect
    error NoDustToCollect();

    /// @dev Thrown when the given locked until is too short compared to block.timestamp
    error LockedUntilTooShort();

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

    modifier onlyWhenLifetimeVaultIsNotRewardable() {
        if (lifetimeVault.isRewardable()) revert LifeTimeVaultIsRewardable();
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
        uint256 lifetimeVaultFees = _computeFeesFromCollateralWithFees(_lifetimeVaultAmount);
        uint256 finalLifetimeVaultCollateralAmount = _lifetimeVaultAmount - lifetimeVaultFees;

        lifetimeVault = new RewardPoolLifetimeVault6022(
            owner(),
            address(this),
            finalLifetimeVaultCollateralAmount,
            address(protocolToken)
        );

        allVaults.push(address(lifetimeVault));
        isVault[address(lifetimeVault)] = true;

        emit VaultCreated(address(lifetimeVault));
    }

    /// @notice This method will deposit the protocol token in the lifetime vault and thus start the reward mechanism.
    function depositToLifetimeVault() external onlyWhenLifetimeVaultExist {
        uint256 lifetimeVaultAmount = lifetimeVault.wantedAmount();

        protocolToken.approve(address(lifetimeVault), lifetimeVaultAmount);
        lifetimeVault.deposit();

        uint256 lifetimeVaultFees = _computeFeesFromCollateral(lifetimeVaultAmount);

        // Reward pool already own the fees
        vaultsRewardWeight[address(lifetimeVault)] += lifetimeVaultFees;
        _updateRewards(lifetimeVaultFees);
    }

    /// @notice This method will withdraw the protocol token dust from the pool
    function collectDust() 
        external
        onlyOwner
        onlyWhenLifetimeVaultExist
        onlyWhenLifetimeVaultIsNotRewardable {

        // Here there is no more rewardable vaults but some vaults can still have rewards (because not yet withdrawn).
        // Those rewards needs to stay in the pool to be harvested when final users will withdraw their collateral in vaults.
        uint256 remainingRewards = _totalCollectedRewards();
        uint256 balance = protocolToken.balanceOf(address(this));

        uint256 dust = balance - remainingRewards;

        if (dust == 0) {
            revert NoDustToCollect();
        }

        protocolToken.transfer(owner(), dust);

        emit DustCollected(dust);
    }

    /// @notice This method will create a new vault.
    function createVault(
        string memory _name,
        uint256 _lockedUntil,
        uint256 _wantedAmount,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType,
        uint256 _backedValueProtocolToken
    ) public onlyOwner onlyWhenLifetimeVaultExist onlyWhenLifetimeVaultIsRewardable {
        if (block.timestamp + 1 minutes > _lockedUntil) {
            revert LockedUntilTooShort();
        }

        // For people who try to cheat by putting a different backed value in case of protocol token collateral
        // We override the passed parameter using the _wantedAmount
        if (_wantedTokenAddress == address(protocolToken)) {
            _backedValueProtocolToken = _wantedAmount;
        }

        uint256 _protocolTokenFees = _computeFeesFromCollateral(_backedValueProtocolToken);

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

    /// @notice Harvest rewards of a closed vault (in case of late withdraw)
    /// @param to Address of the withdrawer
    function harvestRewards(address to) external onlyVault {
        uint256 valueToHarvest = collectedRewards[msg.sender];
        collectedRewards[msg.sender] = 0;

        protocolToken.transfer(to, valueToHarvest);

        emit Harvested(msg.sender, valueToHarvest);
    }

    /// @notice Reinvest rewards of a closed vault into rewardable vaults (in case of early withdraw)
    function reinvestRewards() external onlyVault onlyWhenLifetimeVaultIsRewardable {
        uint256 valueToReinvest = collectedRewards[msg.sender];
        collectedRewards[msg.sender] = 0;

        _updateRewards(valueToReinvest);

        emit Reinvested(msg.sender, valueToReinvest);
    }

    /// @notice Count every rewardable vaults without the lifetime vault
    function countRewardableVaults() public view returns (uint256) {
        uint256 count = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            IBaseVault6022 vault = IBaseVault6022(allVaults[i]);
            if (vault.isRewardable()) {
                count++;
            }
        }

        return count;
    }

    /// @notice Method to inject new rewards to rewardable vaults
    /// @param amount Amount of rewards that need to be injected into rewardable vaults
    function _updateRewards(uint256 amount) internal {
        uint256 totalRewardableRewardWeight = _totalRewardableRewardWeight();
        if (totalRewardableRewardWeight == 0) return; // No vaults to reward and avoid division by zero

        address[] memory rewardableVaults = _rewardableVaults();

        uint256 remainingRewardsToDistribute = amount;

        // The "rewardableVaults" array is not sorted by reward weight to not increase gas cost
        // In case of amountToDistribute == 0, the oldest vaults will be rewarded first
        // Not unfair because of the tiny amount to distribute

        // Distribute rewards
        for (uint256 i = 0; i < rewardableVaults.length; i++) {
            address vaultAddress = rewardableVaults[i];
            uint256 amountToDistribute = (amount * vaultsRewardWeight[vaultAddress]) / totalRewardableRewardWeight;

            if (amountToDistribute == 0 && remainingRewardsToDistribute > 0) {
                amountToDistribute = 1;
            }

            // As we don't sort "rewardableVaults" and due to the previous "if" statement
            // We must verify that "amountToDistribute" is not greater than "remainingRewardsToDistribute"
            // In order to be sure that the reward pool doesn't allow more token than it has to distribute
            if (amountToDistribute > remainingRewardsToDistribute) {
                amountToDistribute = remainingRewardsToDistribute;
            }

            remainingRewardsToDistribute -= amountToDistribute;
            collectedRewards[vaultAddress] += amountToDistribute;
        }
    }

    /// @notice Total reward weight in the pool (only rewardable vaults)
    function _totalRewardableRewardWeight() internal view returns (uint256) {
        uint256 totalRewardableRewardWeight = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            IBaseVault6022 vault = IBaseVault6022(allVaults[i]);
            if (vault.isRewardable()) {
                totalRewardableRewardWeight += vaultsRewardWeight[address(vault)];
            }
        }

        return totalRewardableRewardWeight;
    }

    /// @notice List of rewardable vaults
    function _rewardableVaults() internal view returns (address[] memory) {
        uint256 count = countRewardableVaults();
        address[] memory rewardableVaults = new address[](count);

        uint256 index = 0;
        for (uint i = 0; i < allVaults.length; i++) {
            IBaseVault6022 vault = IBaseVault6022(allVaults[i]);
            if (vault.isRewardable()) {
                rewardableVaults[index] = address(vault);
                index++;
            }
        }

        return rewardableVaults;
    }

    /// @notice Total collected rewards in the pool
    function _totalCollectedRewards() internal view returns (uint256) {
        uint256 totalCollectedRewards = 0;

        for (uint i = 0; i < allVaults.length; i++) {
            totalCollectedRewards += collectedRewards[allVaults[i]];
        }

        return totalCollectedRewards;
    }

    function _computeFeesFromCollateral(uint256 _collateral) internal pure returns (uint256) {
        return (_collateral * FEES_PERCENT) / 100;
    }

    function _computeFeesFromCollateralWithFees(uint256 _collateralWithFees) internal pure returns (uint256) {
        uint256 collateralWithFeesBy100 = _collateralWithFees * 100;
        uint256 feesBy100 = (collateralWithFeesBy100 * FEES_PERCENT) / (100 + FEES_PERCENT);

        return feesBy100 / 100;
    }
}