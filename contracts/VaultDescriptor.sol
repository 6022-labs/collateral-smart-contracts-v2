// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

import {NFTSVG} from "./librairies/NFTSVG.sol";
import {VaultOverview} from "./structs/VaultOverview.sol";
import {StringEscape} from "./librairies/StringEscape.sol";
import {IVaultStates} from "./interfaces/IVault/IVaultStates.sol";
import {IVaultDescriptor} from "./interfaces/IVaultDescriptor.sol";

contract VaultDescriptor is IVaultDescriptor {
    using StringEscape for string;

    /// @dev Build the ERC721 token URI for a specific token.
    /// @param vault The vault collection address.
    /// @param tokenId The token identifier.
    /// @return The metadata URI.
    function buildTokenURI(
        address vault,
        uint256 tokenId
    ) external view returns (string memory) {
        IVaultStates vaultContract = IVaultStates(vault);

        VaultOverview memory overview = vaultContract.vaultOverview();

        string memory image = NFTSVG.generateSVG(NFTSVG.SVGParams({
            name: overview.name,
            tokenId: tokenId,
            vaultAddress: vault,
            creatorAddress: overview.creator,
            rewardPoolAddress: overview.rewardPoolAddress,
            wantedTokenAddress: overview.wantedTokenAddress
        }));
        string memory encodedImage = Base64.encode(bytes(image));

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                overview.name.json(),
                                '", "description":"',
                                "Keys to collateral vaults at 6022 protocol.",
                                '", "image": "',
                                encodedImage,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
