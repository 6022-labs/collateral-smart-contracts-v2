// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import {IVault6022} from "./interfaces/IVault6022.sol";
import {IRewardPool6022} from "./interfaces/IRewardPool6022.sol";
import {ITokenOperation} from "./interfaces/ITokenOperation.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault6022 is ERC721, ReentrancyGuard, IVault6022 {
    struct VaultOverview {
        string name;
        bool isDeposited;
        bool isWithdrawn;
        uint256 lockedUntil;
        uint256 wantedAmount;
        uint256 collectedFees;
        uint256 collectedRewards;
        string wantedTokenSymbol;
        uint256 depositTimestamp;
        uint8 wantedTokenDecimals;
        uint256 withdrawTimestamp;
        uint256 creationTimestamp;
        address rewardPoolAddress;
        address wantedTokenAddress;
        uint256 balanceOfWantedToken;
        uint256 backedValueProtocolToken;
    }

    // ----------------- CONST ----------------- //
    uint public constant MAX_TOKENS = 3;
    uint public constant WITHDRAW_NFTS_EARLY = 2;
    uint public constant WITHDRAW_NFTS_LATE = 1;

    // ----------------- VARIABLES ----------------- //
    /// @notice Indicates if the contract is deposited
    bool public isDeposited;

    /// @notice Indicates if the contract is withdrawn
    bool public isWithdrawn;

    /// @notice Timestamp until the contract is locked
    uint256 public lockedUntil;

    /// @notice ERC20 token amount or ERC721 token id of the wanted token
    uint256 public wantedAmount;

    /// @notice Indicates the deposit timestamp
    uint256 public depositTimestamp;
    
    /// @notice Indicates the withdraw timestamp
    uint256 public withdrawTimestamp;

    /// @notice Indicates the creation timestamp
    uint256 public creationTimestamp;

    /// @notice Reward pool
    IRewardPool6022 public rewardPool;

    /// @notice ERC20 or ERC721 token address
    ITokenOperation public wantedToken;

    // ----------------- EVENTS ----------------- //
    /// @dev Emitted when the contract is deposited
    event Deposited(address depositor, uint256 amount);

    /// @dev Emitted when the contract is withdrawn
    event Withdrawn(address withdrawer, uint256 amount);

    // ----------------- ERRORS ----------------- //
    /// @dev Error when user tries to deposit after the lockedUntil timestamp
    error TooLateToDeposit();

    /// @dev Error when the contract is not deposited
    error ContractNotDeposited();

    /// @dev Error when trying to deposit without enough NFTs
    error NotEnoughtNFTToDeposit();

    /// @dev Error when trying to withdraw without enough NFTs
    error NotEnoughtNFTToWithdraw();

    /// @dev Error when the contract is already deposited
    error ContractAlreadyDeposited();

    constructor(
        address _creator, 
        string memory _name, 
        uint256 _lockedUntil,
        uint256 _wantedAmount,
        address _rewardPoolAddress,
        address _wantedTokenAddress) ERC721(_name, "6022") {
        
        isDeposited = false;
        isWithdrawn = false;
        lockedUntil = _lockedUntil;
        wantedAmount = _wantedAmount;
        creationTimestamp = block.timestamp;
        rewardPool = IRewardPool6022(_rewardPoolAddress);
        wantedToken = ITokenOperation(_wantedTokenAddress);

        // Mint tokens to this contract's address
        for(uint i = 1; i <= MAX_TOKENS; i++) {
            _mint(address(_creator), i);
        }
    }

    function deposit() public nonReentrant {
        if (isDeposited) {
            revert ContractAlreadyDeposited();
        }

        if (balanceOf(msg.sender) == 0) {
            revert NotEnoughtNFTToDeposit();
        }

        if (block.timestamp > lockedUntil) {
            revert TooLateToDeposit();
        }

        wantedToken.transferFrom(msg.sender, address(this), wantedAmount);
        
        isDeposited = true;
        depositTimestamp = block.timestamp;

        emit Deposited(msg.sender, wantedAmount);
    }

    function withdraw() public nonReentrant {
        if (!isDeposited) {
            revert ContractNotDeposited();
        }

        uint256 requiredNFTs = getRequiredNftsToWithdraw();
        if (requiredNFTs > balanceOf(msg.sender)) {
            revert NotEnoughtNFTToWithdraw();
        }

        uint256 tokenAmount = wantedToken.balanceOf(address(this));
        wantedToken.approve(address(this), tokenAmount);
        wantedToken.transferFrom(address(this), msg.sender, tokenAmount);

        isWithdrawn = true;
        withdrawTimestamp = block.timestamp;

        if (requiredNFTs == WITHDRAW_NFTS_LATE) {
            rewardPool.harvestRewards(msg.sender);
        } else {
            rewardPool.reinvestRewards();
        }

        emit Withdrawn(msg.sender, tokenAmount);
    }

    function getRequiredNftsToWithdraw() public view returns (uint256) {
        return block.timestamp < lockedUntil ? WITHDRAW_NFTS_EARLY : WITHDRAW_NFTS_LATE;
    }

    function vaultOverview() external view returns (VaultOverview memory) {
        string memory wantedTokenSymbol = "N/A";
        (bool success, bytes memory data) = address(wantedToken).staticcall(abi.encodeWithSignature("symbol()"));
        if (success) {
            wantedTokenSymbol = abi.decode(data, (string));
        } else {
            (success, data) = address(wantedToken).staticcall(abi.encodeWithSignature("name()"));
            if (success) {
                wantedTokenSymbol = abi.decode(data, (string));
            }
        }

        uint8 wantedTokenDecimals = 0;
        (success, data) = address(wantedToken).staticcall(abi.encodeWithSignature("decimals()"));
        if (success) {
            wantedTokenDecimals = abi.decode(data, (uint8));
        }

        return VaultOverview({
            name: name(),
            isDeposited: isDeposited,
            isWithdrawn: isWithdrawn,
            lockedUntil: lockedUntil,
            wantedAmount: wantedAmount,
            depositTimestamp: depositTimestamp,
            withdrawTimestamp: withdrawTimestamp,
            creationTimestamp: creationTimestamp,
            wantedTokenSymbol: wantedTokenSymbol,
            rewardPoolAddress: address(rewardPool),
            wantedTokenAddress: address(wantedToken),
            wantedTokenDecimals: wantedTokenDecimals,
            collectedFees: rewardPool.collectedFees(address(this)),
            balanceOfWantedToken: wantedToken.balanceOf(address(this)),
            collectedRewards: rewardPool.collectedRewards(address(this)),
            backedValueProtocolToken: rewardPool.collectedFees(address(this)) / rewardPool.FEES_PERCENT() * 100
        });
    }
}
