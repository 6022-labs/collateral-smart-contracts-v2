// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVault6022} from "./interfaces/IVault6022.sol";
import {IController6022} from "./interfaces/IController6022.sol";
import {IRewardPool6022} from "./interfaces/IRewardPool6022.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Controller 6022
 * @author 6022
 * @notice This contract aims to register all vaults and reward pools.
 */
contract Controller6022 is AccessControl, IController6022 {
    // ----------------- CONST ----------------- //
    /// @notice The role that allows an account to use admin functions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice The role that allows factories to use factory functions
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    // ----------------- VARIABLES ----------------- //
    /// @notice List of all vaults
    address[] public allVaults;

    /// @notice List of all reward pools
    address[] public allRewardPools;

    /// @notice Mapping of all reward pools
    mapping(address => bool) public isRewardPool;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when a vault is pushed
    event VaultPushed(address vault);

    /// @dev Emitted when a admin is added
    event AdminAdded(address account);

    /// @dev Emitted when a admin is removed
    event AdminRemoved(address account);

    /// @dev Emitted when a factory is added
    event FactoryAdded(address account);

    /// @dev Emitted when a factory is removed
    event FactoryRemoved(address account);

    /// @dev Emitted when a reward pool is pushed
    event RewardPoolPushed(address rewardPool);

    // ----------------- ERRORS ----------------- //
    /// @dev Error when the caller is not a reward pool
    error NotRewardPool();

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
        emit AdminAdded(msg.sender);
    }

    // ----------------- MODIFIERS ----------------- //
    modifier onlyRewardPool() {
        if (!isRewardPool[msg.sender]) {
            revert NotRewardPool();
        }
        _;
    }

    // ----------------- FUNCS ----------------- //
    function allVaultsLength() external view returns (uint) {
        return allVaults.length;
    }

    function allRewardPoolsLength() external view returns (uint) {
        return allRewardPools.length;
    }

    function pushVault(address _vault) external onlyRewardPool {
        allVaults.push(_vault);
        emit VaultPushed(_vault);
    }

    function pushRewardPool(address _rewardPool) external onlyRole(FACTORY_ROLE) {
        allRewardPools.push(_rewardPool);
        isRewardPool[_rewardPool] = true;
        emit RewardPoolPushed(_rewardPool);
    }

    function addFactory(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(FACTORY_ROLE, account);
        emit FactoryAdded(account);
    }

    function removeFactory(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(FACTORY_ROLE, account);
        emit FactoryRemoved(account);
    }

    function addAdmin(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, account);
        emit AdminAdded(account);
    }

    function removeAdmin(address account) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ADMIN_ROLE, account);
        emit AdminRemoved(account);
    }

    function getRewardPoolsByCreator(address creator) external view returns (address[] memory) {
        uint256 counter = 0;

        for (uint256 i = 0; i < allRewardPools.length; i++) {
            IRewardPool6022 rewardPool = IRewardPool6022(allRewardPools[i]);
            if (rewardPool.creator() == creator) {
                counter++;
            }
        }

        address[] memory creatorRewardPool = new address[](counter);
        uint256 index = 0;

        for (uint256 i = 0; i < allRewardPools.length; i++) {
            IRewardPool6022 rewardPool = IRewardPool6022(allRewardPools[i]);
            if (rewardPool.creator() == creator) {
                creatorRewardPool[index] = allRewardPools[i];
                index++;
            }
        }

        return creatorRewardPool;
    }

    function getVaultsByOwner(address owner) external view returns (address[] memory) {
        uint256 counter = 0;

        for (uint256 i = 0; i < allVaults.length; i++) {
            IERC721 vault = IERC721(allVaults[i]);
            if (vault.balanceOf(owner) > 0) {
                counter++;
            }
        }

        address[] memory ownerVault = new address[](counter);
        uint256 index = 0;

        for (uint256 i = 0; i < allVaults.length; i++) {
            IERC721 vault = IERC721(allVaults[i]);
            if (vault.balanceOf(owner) > 0) {
                ownerVault[index] = allVaults[i];
                index++;
            }
        }

        return ownerVault;
    }
}