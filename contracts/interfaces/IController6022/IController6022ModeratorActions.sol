// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IController6022ModeratorActions {
    function addFactory(address) external;

    function removeFactory(address) external;

    function addAdmin(address) external;

    function removeAdmin(address) external;
}
