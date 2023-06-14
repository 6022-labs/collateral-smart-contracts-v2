// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Collection6022 is ERC721 {
    uint public constant MAX_TOKENS = 3;

    constructor(address to_, string memory name_) ERC721(name_, "6022") {
        for(uint i = 1; i <= MAX_TOKENS; i++) {
            _safeMint(to_, i);
        }
    }

    function batchTransfer(address to) public {
        for (uint i = 1; i < MAX_TOKENS; i++) {
            safeTransferFrom(_msgSender(), to, i);
        }
    }
}
