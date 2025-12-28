// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

import {NFTSVG} from "./librairies/NFTSVG.sol";
import {VaultOverview} from "./structs/VaultOverview.sol";
import {StringEscape} from "./librairies/StringEscape.sol";
import {IVault6022States} from "./interfaces/IVault6022/IVault6022States.sol";
import {IVaultDescriptor6022} from "./interfaces/IVaultDescriptor6022.sol";

contract VaultDescriptor6022 is IVaultDescriptor6022 {
    using StringEscape for string;

    /// @dev Build the ERC721 token URI for a specific token.
    /// @param vault The vault collection address.
    /// @param tokenId The token identifier.
    /// @return The metadata URI.
    function buildTokenURI(
        address vault,
        uint256 tokenId
    ) external view returns (string memory) {
        IVault6022States vault6022 = IVault6022States(vault);

        VaultOverview memory overview = vault6022.vaultOverview();

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
