// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token6022 is ERC20 {
    constructor(uint256 initialSupply) ERC20("Token6022", "T6022") {
        _mint(msg.sender, initialSupply);
    }
}
