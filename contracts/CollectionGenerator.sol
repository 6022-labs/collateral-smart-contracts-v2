// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./Collection6022.sol";
import "./interfaces/ICollectionGenerator.sol";

contract CollectionGenerator is ICollectionGenerator {
    address private controllerAddress;

    constructor(address controllerAddress_) {
        controllerAddress = controllerAddress_;
    }

    function createCollection(address to, string memory name) public override returns (address) {
        require (msg.sender == controllerAddress, "Only the controller can create collections");
        
        return address(new Collection6022(to, name));
    }
}