// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {CollateralBaseVault} from "./CollateralBaseVault.sol";
import {VaultOverview} from "./structs/VaultOverview.sol";
import {VaultStorageEnum} from "./enums/VaultStorageEnum.sol";
import {ICollateralTokenOperation} from "./interfaces/ICollateralTokenOperation.sol";
import {ICollateralVault} from "./interfaces/ICollateralVault/ICollateralVault.sol";
import {ICollateralControllerStates} from "./interfaces/ICollateralController/ICollateralControllerStates.sol";
import {ICollateralRewardPoolStates} from "./interfaces/ICollateralRewardPool/ICollateralRewardPoolStates.sol";
import {ICollateralRewardPoolVaultActions} from "./interfaces/ICollateralRewardPool/ICollateralRewardPoolVaultActions.sol";
import {ICollateralVaultDescriptorActions} from "./interfaces/ICollateralVaultDescriptor/ICollateralVaultDescriptorActions.sol";

/**
 * @title CollateralVault
 * @author 6022
 * @notice This contract is created inside a reward pool.
 * It will be used as a vault for every users to deposit a collateral for a reward pool owner.
 */
contract CollateralVault is ERC721, CollateralBaseVault, ReentrancyGuard, ICollateralVault {
    // ----------------- CONST ----------------- //
    uint public constant MAX_TOKENS = 3;
    uint public constant WITHDRAW_NFTS_EARLY = 2;
    uint public constant WITHDRAW_NFTS_LATE = 1;

    // ----------------- VARIABLES ----------------- //
    /// @notice Creator of the contract
    address public creator;

    /// @notice Timestamp until the contract is locked (before = 2 NFT to withdraw, after = 1 NFT to withdraw)
    uint256 public lockedUntil;

    /// @notice Vault image (IPFS hash/path)
    string public image;

    /// @notice Indicates the deposit timestamp
    uint256 public depositTimestamp;

    /// @notice Indicates the withdraw timestamp
    uint256 public withdrawTimestamp;

    /// @notice Indicates the creation timestamp
    uint256 public creationTimestamp;

    /// @notice ERC20 or ERC721 token address
    address public wantedTokenAddress;

    /// @notice Indicate if the 'wantedTokenAddress' is a ERC20 or ERC721 token
    VaultStorageEnum public storageType;

    constructor(
        address _creator,
        string memory _name,
        string memory _image,
        uint256 _lockedUntil,
        uint256 _wantedAmount,
        address _rewardPoolAddress,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType
    ) ERC721(_name, "6022") CollateralBaseVault(_rewardPoolAddress, _wantedAmount) {
        creator = _creator;
        image = _image;
        lockedUntil = _lockedUntil;
        storageType = _storageType;
        creationTimestamp = block.timestamp;
        wantedTokenAddress = _wantedTokenAddress;

        // Mint tokens to the creator (transaction signer)
        for (uint i = 1; i <= MAX_TOKENS; i++) {
            _mint(address(_creator), i);
        }
    }

    function deposit() public onlyWhenNotDeposited nonReentrant {
        if (balanceOf(msg.sender) == 0) {
            revert NotEnoughNFTToDeposit();
        }

        if (block.timestamp > lockedUntil) {
            revert TooLateToDeposit();
        }

        ICollateralTokenOperation wantedToken = ICollateralTokenOperation(wantedTokenAddress);
        wantedToken.transferFrom(msg.sender, address(this), wantedAmount);

        isDeposited = true;
        depositTimestamp = block.timestamp;

        emit Deposited(msg.sender, wantedAmount);
    }

    /// @notice Once the vault is withdrawn, the vault is considered as a "dead" smart contract.
    function withdraw()
        public
        onlyWhenDeposited
        onlyWhenNotWithdrawn
        nonReentrant
    {
        uint256 requiredNFTs = getRequiredNftsToWithdraw();
        if (requiredNFTs > balanceOf(msg.sender)) {
            revert NotEnoughNFTToWithdraw();
        }

        if (storageType == VaultStorageEnum.ERC721) {
            IERC721 wantedToken = IERC721(wantedTokenAddress);

            wantedToken.transferFrom(address(this), msg.sender, wantedAmount);
            emit Withdrawn(msg.sender, wantedAmount);
        } else {
            IERC20 wantedToken = IERC20(wantedTokenAddress);
            uint256 balance = wantedToken.balanceOf(address(this));

            wantedToken.transfer(msg.sender, balance);
            emit Withdrawn(msg.sender, balance);
        }

        // We put "isWithdrawn" to true to put the vault as non rewardable
        // As the vault will be considered as a "dead" smart contract
        // We don't want to reward it anymore via other contracts creation or via the reinvest method
        isWithdrawn = true;
        withdrawTimestamp = block.timestamp;

        if (requiredNFTs == WITHDRAW_NFTS_LATE) {
            ICollateralRewardPoolVaultActions(rewardPool).harvestRewards(msg.sender);
        } else {
            ICollateralRewardPoolVaultActions(rewardPool).reinvestRewards();
        }
    }

    function getRequiredNftsToWithdraw() public view returns (uint256) {
        return
            block.timestamp < lockedUntil
                ? WITHDRAW_NFTS_EARLY
                : WITHDRAW_NFTS_LATE;
    }

    function isRewardable() external view returns (bool) {
        return lockedUntil > block.timestamp && isDeposited && !isWithdrawn;
    }

    function vaultOverview() external view returns (VaultOverview memory) {
        string memory wantedTokenSymbol = "N/A";
        (bool success, bytes memory data) = wantedTokenAddress.staticcall(
            abi.encodeWithSignature("symbol()")
        );
        if (success) {
            wantedTokenSymbol = abi.decode(data, (string));
        } else {
            (success, data) = wantedTokenAddress.staticcall(
                abi.encodeWithSignature("name()")
            );
            if (success) {
                wantedTokenSymbol = abi.decode(data, (string));
            }
        }

        uint8 wantedTokenDecimals = 0;
        (success, data) = wantedTokenAddress.staticcall(
            abi.encodeWithSignature("decimals()")
        );
        if (success) {
            wantedTokenDecimals = abi.decode(data, (uint8));
        }

        ICollateralTokenOperation wantedToken = ICollateralTokenOperation(wantedTokenAddress);
        ICollateralRewardPoolStates rewardPoolStates = ICollateralRewardPoolStates(
            rewardPool
        );

        return
            VaultOverview({
                name: name(),
                creator: creator,
                isDeposited: isDeposited,
                isWithdrawn: isWithdrawn,
                lockedUntil: lockedUntil,
                storageType: storageType,
                wantedAmount: wantedAmount,
                depositTimestamp: depositTimestamp,
                withdrawTimestamp: withdrawTimestamp,
                creationTimestamp: creationTimestamp,
                wantedTokenSymbol: wantedTokenSymbol,
                rewardPoolAddress: address(rewardPool),
                wantedTokenAddress: wantedTokenAddress,
                wantedTokenDecimals: wantedTokenDecimals,
                rewardWeight: rewardPoolStates.vaultsRewardWeight(address(this)),
                balanceOfWantedToken: wantedToken.balanceOf(address(this)),
                collectedRewards: rewardPoolStates.collectedRewards(address(this)),
                backedValueProtocolToken: (rewardPoolStates.vaultsRewardWeight(
                    address(this)
                ) * 100) / rewardPoolStates.FEES_PERCENT()
            });
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);

        address controllerAddress = ICollateralRewardPoolStates(rewardPool)
            .controller();
        address vaultDescriptorAddress = ICollateralControllerStates(controllerAddress)
            .vaultDescriptor();

        return ICollateralVaultDescriptorActions(vaultDescriptorAddress).buildTokenURI(
            address(this),
            tokenId
        );
    }
}
