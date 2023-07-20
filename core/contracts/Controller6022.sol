// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./interfaces/ICollection6022.sol";
import "./interfaces/ICollectionGenerator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Controller6022 is Ownable {
    address private collectionGeneratorAddress;
    ICollectionGenerator private collectionGenerator;

    event CollectionGeneratorUpdated(address indexed collectionGeneratorAddress);
    event CollectionCreated(address indexed collectionAddress);

    mapping(address => bool) public tokensAllowed;

    address[] public allCollections;

    function allPairsLength() external view returns (uint) {
        return allCollections.length;
    }

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

        address collectionAddress = collectionGenerator.createCollection(name, tokenContract, msg.sender);
        allCollections.push(collectionAddress);
        emit CollectionCreated(collectionAddress);

        return address(collectionAddress);
    }

    function getCollectionsByCreator(address creator) external view returns (address[] memory) {
        uint256 counter = 0;

        for (uint256 i = 0; i < allCollections.length; i++) {
            ICollection6022 collection = ICollection6022(allCollections[i]);
            if (collection.creator() == creator) {
                counter++;
            }
        }

        address[] memory creatorCollections = new address[](counter);
        uint256 index = 0;

        for (uint256 i = 0; i < allCollections.length; i++) {
            ICollection6022 collection = ICollection6022(allCollections[i]);
            if (collection.creator() == creator) {
                creatorCollections[index] = allCollections[i];
                index++;
            }
        }

        return creatorCollections;
    }

    function getCollectionsByOwner(address owner) external view returns (address[] memory) {
        uint256 counter = 0;

        for (uint256 i = 0; i < allCollections.length; i++) {
            IERC20 collection = IERC20(allCollections[i]);
            if (collection.balanceOf(owner) > 0) {
                counter++;
            }
        }

        address[] memory ownerCollections = new address[](counter);
        uint256 index = 0;

        for (uint256 i = 0; i < allCollections.length; i++) {
            IERC20 collection = IERC20(allCollections[i]);
            if (collection.balanceOf(owner) > 0) {
                ownerCollections[index] = allCollections[i];
                index++;
            }
        }

        return ownerCollections;
    }
}