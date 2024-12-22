// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseVault6022} from "./BaseVault6022.sol";
import {IVault6022} from "./interfaces/IVault6022.sol";
import {VaultStorageEnum} from "./VaultStorageEnum.sol";
import {ITokenOperation} from "./interfaces/ITokenOperation.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

struct VaultOverview {
    string name;
    address creator;
    bool isDeposited;
    bool isWithdrawn;
    uint256 lockedUntil;
    uint256 wantedAmount;
    uint256 rewardWeight;
    uint256 collectedRewards;
    string wantedTokenSymbol;
    uint256 depositTimestamp;
    uint8 wantedTokenDecimals;
    uint256 withdrawTimestamp;
    uint256 creationTimestamp;
    address rewardPoolAddress;
    address wantedTokenAddress;
    uint256 balanceOfWantedToken;
    VaultStorageEnum storageType;
    uint256 backedValueProtocolToken;
}

/**
 * @title Vault6022
 * @author 6022
 * @notice This contract is created inside a reward pool.
 * It will be used as a vault for every users to deposit a collateral for a reward pool owner.
 */
contract Vault6022 is ERC721, BaseVault6022, ReentrancyGuard, IVault6022 {
    // ----------------- CONST ----------------- //
    uint public constant MAX_TOKENS = 3;
    uint public constant WITHDRAW_NFTS_EARLY = 2;
    uint public constant WITHDRAW_NFTS_LATE = 1;

    // ----------------- VARIABLES ----------------- //
    /// @notice Creator of the contract
    address public creator;

    /// @notice Timestamp until the contract is locked (before = 2 NFT to withdraw, after = 1 NFT to withdraw)
    uint256 public lockedUntil;

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

    // ----------------- ERRORS ----------------- //
    /// @dev Error when user tries to deposit after the lockedUntil timestamp
    error TooLateToDeposit();

    /// @dev Error when trying to deposit without enough NFTs
    error NotEnoughNFTToDeposit();

    /// @dev Error when trying to withdraw without enough NFTs
    error NotEnoughNFTToWithdraw();

    constructor(
        address _creator, 
        string memory _name, 
        uint256 _lockedUntil,
        uint256 _wantedAmount,
        address _rewardPoolAddress,
        address _wantedTokenAddress,
        VaultStorageEnum _storageType
    ) ERC721(_name, "6022") BaseVault6022(_rewardPoolAddress, _wantedAmount) {
        creator = _creator;
        lockedUntil = _lockedUntil;
        storageType = _storageType;
        creationTimestamp = block.timestamp;
        wantedTokenAddress = _wantedTokenAddress;

        // Mint tokens to the creator (transaction signer)
        for(uint i = 1; i <= MAX_TOKENS; i++) {
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

        ITokenOperation wantedToken = ITokenOperation(wantedTokenAddress);
        wantedToken.transferFrom(msg.sender, address(this), wantedAmount);

        isDeposited = true;
        depositTimestamp = block.timestamp;

        emit Deposited(msg.sender, wantedAmount);
    }

    /// @notice Once the vault is withdrawn, the vault is considered as a "dead" smart contract.
    function withdraw() public onlyWhenDeposited onlyWhenNotWithdrawn nonReentrant {
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
            rewardPool.harvestRewards(msg.sender);
        } else {
            rewardPool.reinvestRewards();
        }
    }

    function getRequiredNftsToWithdraw() public view returns (uint256) {
        return block.timestamp < lockedUntil ? WITHDRAW_NFTS_EARLY : WITHDRAW_NFTS_LATE;
    }

    function isRewardable() external view returns (bool) {
        return lockedUntil > block.timestamp && isDeposited && !isWithdrawn;
    }

    function vaultOverview() external view returns (VaultOverview memory) {
        string memory wantedTokenSymbol = "N/A";
        (bool success, bytes memory data) = wantedTokenAddress.staticcall(abi.encodeWithSignature("symbol()"));
        if (success) {
            wantedTokenSymbol = abi.decode(data, (string));
        } else {
            (success, data) = wantedTokenAddress.staticcall(abi.encodeWithSignature("name()"));
            if (success) {
                wantedTokenSymbol = abi.decode(data, (string));
            }
        }

        uint8 wantedTokenDecimals = 0;
        (success, data) = wantedTokenAddress.staticcall(abi.encodeWithSignature("decimals()"));
        if (success) {
            wantedTokenDecimals = abi.decode(data, (uint8));
        }

        ITokenOperation wantedToken = ITokenOperation(wantedTokenAddress);

        return VaultOverview({
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
            rewardWeight: rewardPool.vaultsRewardWeight(address(this)),
            balanceOfWantedToken: wantedToken.balanceOf(address(this)),
            collectedRewards: rewardPool.collectedRewards(address(this)),
            backedValueProtocolToken: rewardPool.vaultsRewardWeight(address(this)) / rewardPool.FEES_PERCENT() * 100
        });
    }
}
