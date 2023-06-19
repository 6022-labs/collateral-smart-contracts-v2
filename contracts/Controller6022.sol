// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./interfaces/ICollectionGenerator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Controller6022 is Ownable {
    address private collectionGeneratorAddress;
    ICollectionGenerator private collectionGenerator;

    event CollectionGeneratorUpdated(address indexed collectionGeneratorAddress);
    event CollectionCreated(address indexed collectionAddress);

    function updateCollectionGenerator(address collectionGeneratorAddress_) public onlyOwner {
        collectionGeneratorAddress = collectionGeneratorAddress_;
        collectionGenerator = ICollectionGenerator(collectionGeneratorAddress);

        emit CollectionGeneratorUpdated(collectionGeneratorAddress);
    }

    function getCollectionGeneratorAddress() public view returns (address) {
        return collectionGeneratorAddress;
    }

    function createCollection(string memory name) public returns (address) {
        require(collectionGeneratorAddress != address(0), "CollectionGenerator address not set");
        
        address collectionAddress = collectionGenerator.createCollection(msg.sender, name);

        emit CollectionCreated(collectionAddress);

        return address(collectionAddress);
    }
}