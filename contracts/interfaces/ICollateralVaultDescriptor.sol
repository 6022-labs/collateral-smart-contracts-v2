// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralVaultDescriptor {
    /// @dev Build the ERC721 token URI for a specific token.
    /// @param vault The vault collection address.
    /// @param tokenId The token identifier.
    /// @return The metadata URI.
    function buildTokenURI(
        address vault,
        uint256 tokenId
    ) external view returns (string memory);
}
