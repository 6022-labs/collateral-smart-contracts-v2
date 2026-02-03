// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICollateralVaultDescriptorEvents {
    /// @dev Emitted when the IPFS gateway is updated.
    event IpfsGatewayUpdated(string oldGateway, string newGateway);
}
