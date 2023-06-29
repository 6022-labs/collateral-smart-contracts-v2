// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Collection6022 is ERC721, ReentrancyGuard {
    uint public constant MAX_TOKENS = 3;
    uint public constant WITHDRAWAL_PERIOD = 36 * 30 days;
    uint public constant WITHDRAW_NFTS_EARLY = 2;
    uint public constant WITHDRAW_NFTS_LATE = 1;

    uint public totalSupply = 3;

    IERC20 public token;
    address public weth;

    uint256 public etherBalance;
    uint256 public tokenBalance;
    
    bool public isLocked;
    uint256 public depositTimestamp;

    constructor(string memory name_, IERC20 token_, address weth_) ERC721(name_, "6022") {
        token = token_;
        weth = weth_;

        etherBalance = 0;
        tokenBalance = 0;
        isLocked = false;

        // Mint tokens to this contract's address
        for(uint i = 1; i <= MAX_TOKENS; i++) {
            _mint(address(this), i);
        }
    }

    function transferMultiple(address to) public {
        for (uint i = 1; i < MAX_TOKENS; i++) {
            safeTransferFrom(_msgSender(), to, i);
        }
    }

    function depositEther() public payable nonReentrant {
        require(!isLocked, "The contract is locked, a deposit has already been made");
        require(address(token) == weth, "Ether deposit not allowed, token is not WETH");

        etherBalance += msg.value;

        // Transfer all tokens from contract to sender
        for(uint256 i = 1; i <= MAX_TOKENS; i++) {
            _transfer(address(this), msg.sender, i);
        }

        // Lock the contract
        isLocked = true;
        depositTimestamp = block.timestamp;
    }

    function depositToken(uint256 amount) public nonReentrant {
        require(!isLocked, "The contract is locked, a deposit has already been made");

        tokenBalance += amount;

        // Call external function
        token.transferFrom(msg.sender, address(this), amount);

        // Transfer all tokens from contract to sender
        for(uint256 i = 1; i <= MAX_TOKENS; i++) {
            _transfer(address(this), msg.sender, i);
        }

        // Lock the contract
        isLocked = true;
        depositTimestamp = block.timestamp;
    }

    function withdraw(uint256 amount) public nonReentrant {
        require(balanceOf(msg.sender) >= getRequiredNfts(), "Not enough NFTs to withdraw");
        require(tokenBalance >= amount, "Not enough tokens to withdraw");

        tokenBalance -= amount;

        token.transfer(msg.sender, amount);
    }

    function withdrawEther(uint256 amount) public nonReentrant {
        require(address(token) == weth, "Ether withdrawals only allowed when token is WETH");

        require(balanceOf(msg.sender) >= getRequiredNfts(), "Not enough NFTs to withdraw");
        require(etherBalance >= amount, "Not enough ethers to withdraw");

        etherBalance -= amount;
        payable(msg.sender).transfer(amount);
    }

    function getRequiredNfts() public view returns (uint256) {
        return block.timestamp > depositTimestamp + WITHDRAWAL_PERIOD ? WITHDRAW_NFTS_LATE : WITHDRAW_NFTS_EARLY;
    }
}
