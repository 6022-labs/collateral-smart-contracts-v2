// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IWETH.sol";

contract Collection6022 is ERC721, ReentrancyGuard {
    uint public constant MAX_TOKENS = 3;

    IERC20 public token;
    address public WETH;
    
    // How much Ether and Tokens each address has deposited
    mapping(address => uint256) public tokenBalances;

    // The block number when the last token was minted for each address
    mapping(address => uint256) public lastMintedBlock;

    bool public isLocked;

    constructor(string memory name_, IERC20 token_, address WETH_) ERC721(name_, "6022") {
        token = token_;
        WETH = WETH_;

        isLocked = false;

        // Mint tokens to this contract's address
        for(uint i = 1; i <= MAX_TOKENS; i++) {
            _mint(address(this), i);
        }
    }

    function batchTransfer(address to) public {
        for (uint i = 1; i < MAX_TOKENS; i++) {
            safeTransferFrom(_msgSender(), to, i);
        }
    }

    function depositEther() public payable nonReentrant {
        require(!isLocked, "The contract is locked, a deposit has already been made");
        require(address(token) == WETH, "Ether deposit not allowed, token is not WETH");

        // Convert ETH to WETH on the fly
        IWETH(WETH).deposit{value: msg.value}();
        tokenBalances[msg.sender] += msg.value;

        // Transfer all tokens from contract to sender
        for(uint256 i = 1; i <= MAX_TOKENS; i++) {
            _transfer(address(this), msg.sender, i);
        }

        // Lock the contract
        isLocked = true;
    }

    function depositToken(uint256 amount) public nonReentrant {
        require(!isLocked, "The contract is locked, a deposit has already been made");

        tokenBalances[msg.sender] += amount;

        // Call external function
        token.transferFrom(msg.sender, address(this), amount);

        // Transfer all tokens from contract to sender
        for(uint256 i = 1; i <= MAX_TOKENS; i++) {
            _transfer(address(this), msg.sender, i);
        }

        // Lock the contract
        isLocked = true;
    }
}
