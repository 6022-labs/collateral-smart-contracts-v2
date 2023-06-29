// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./interfaces/ICollectionGenerator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Controller6022 is Ownable {
    address private collectionGeneratorAddress;
    ICollectionGenerator private collectionGenerator;

    event CollectionGeneratorUpdated(address indexed collectionGeneratorAddress);
    event CollectionCreated(address indexed collectionAddress);

    mapping(address => bool) public tokensAllowed;

    function updateCollectionGenerator(address collectionGeneratorAddress_) public onlyOwner {
        collectionGeneratorAddress = collectionGeneratorAddress_;
        collectionGenerator = ICollectionGenerator(collectionGeneratorAddress);

        emit CollectionGeneratorUpdated(collectionGeneratorAddress);
    }

    function allowToken(address token) public onlyOwner {
        tokensAllowed[token] = true;
    }

    function disallowToken(address token) public onlyOwner {
        tokensAllowed[token] = false;
    }

    function getCollectionGeneratorAddress() public view returns (address) {
        return collectionGeneratorAddress;
    }

    function createCollection(string memory name, address token) public returns (address) {
        require(collectionGeneratorAddress != address(0), "CollectionGenerator address not set");
        require(token != address(0), "Token address cannot be 0");
        require(tokensAllowed[token], "Token not allowed");
        
        IERC20 tokenContract = IERC20(token);

        address collectionAddress = collectionGenerator.createCollection(name, tokenContract);
        emit CollectionCreated(collectionAddress);

        return address(collectionAddress);
    }
}