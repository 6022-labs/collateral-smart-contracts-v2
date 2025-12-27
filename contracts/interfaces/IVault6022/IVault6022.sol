// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVault6022States} from "./IVault6022States.sol";
import {IVault6022Errors} from "./IVault6022Errors.sol";
import {IVault6022Helpers} from "./IVault6022Helpers.sol";

import {VaultOverview} from "../../structs/VaultOverview.sol";
import {IBaseVault6022} from "../IBaseVault6022/IBaseVault6022.sol";

interface IVault6022 is
    IBaseVault6022,
    IVault6022States,
    IVault6022Errors,
    IVault6022Helpers
{
}
