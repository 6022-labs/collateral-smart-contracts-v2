// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./Collection6022.sol";
import "./interfaces/ICollectionGenerator.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CollectionGenerator is ICollectionGenerator {
    address private controllerAddress;
    address public WETH;

    constructor(address controllerAddress_, address WETH_) {
        controllerAddress = controllerAddress_;
        WETH = WETH_;
    }

    function createCollection(string memory name, IERC20 token) public override returns (address) {
        require (msg.sender == controllerAddress, "Only the controller can create collections");
        
        return address(new Collection6022(name, token, WETH));
    }
}