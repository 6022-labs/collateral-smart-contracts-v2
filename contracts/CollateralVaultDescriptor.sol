// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {VaultOverview} from "./structs/VaultOverview.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ICollateralVaultStates} from "./interfaces/ICollateralVault/ICollateralVaultStates.sol";
import {ICollateralVaultDescriptor} from "./interfaces/ICollateralVaultDescriptor/ICollateralVaultDescriptor.sol";

contract CollateralVaultDescriptor is AccessControl, ICollateralVaultDescriptor {
    string private _ipfsGateway;

    constructor(string memory ipfsGateway) {
        _ipfsGateway = ipfsGateway;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function updateIpfsGateway(
        string memory ipfsGateway
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldGateway = _ipfsGateway;
        _ipfsGateway = ipfsGateway;
        emit IpfsGatewayUpdated(oldGateway, ipfsGateway);
    }

    /// @dev Build the ERC721 token URI for a specific token.
    /// @param vault The vault collection address.
    /// @param tokenId The token identifier.
    /// @return The metadata URI.
    function buildTokenURI(
        address vault,
        uint256 tokenId
    ) external view returns (string memory) {
        ICollateralVaultStates vaultContract = ICollateralVaultStates(vault);
        VaultOverview memory overview = vaultContract.vaultOverview();

        string memory name = _escapeQuotes(overview.name);
        string memory description = _escapeQuotes(
            "Keys to collateral vaults."
        );
        string memory imageUrl = _generateImageUrl(_getImage(vaultContract, tokenId));

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name,
                                '", "description":"',
                                description,
                                '", "image": "',
                                imageUrl,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function _escapeQuotes(
        string memory value
    ) internal pure returns (string memory) {
        bytes memory valueBytes = bytes(value);
        uint256 quotesCount = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            if (valueBytes[i] == '"') {
                quotesCount++;
            }
        }
        if (quotesCount > 0) {
            bytes memory escapedBytes = new bytes(valueBytes.length + quotesCount);
            uint256 index;
            for (uint256 i = 0; i < valueBytes.length; i++) {
                if (valueBytes[i] == '"') {
                    escapedBytes[index++] = "\\";
                }
                escapedBytes[index++] = valueBytes[i];
            }
            return string(escapedBytes);
        }

        return value;
    }

    function _getImage(
        ICollateralVaultStates vaultContract,
        uint256 /* tokenId */
    ) internal view returns (string memory) {
        string memory image = vaultContract.image();
        if (bytes(image).length == 0) {
            revert MissingImage();
        }

        return image;
    }

    function _generateImageUrl(
        string memory image
    ) internal view returns (string memory) {
        return string(abi.encodePacked(_ipfsGateway, image));
    }
}
