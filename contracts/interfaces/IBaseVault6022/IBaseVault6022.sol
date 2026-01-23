// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IBaseVault6022Events} from "./IBaseVault6022Events.sol";
import {IBaseVault6022Errors} from "./IBaseVault6022Errors.sol";
import {IBaseVault6022States} from "./IBaseVault6022States.sol";
import {IBaseVault6022Actions} from "./IBaseVault6022Actions.sol";

interface IBaseVault6022 is
    IBaseVault6022Events,
    IBaseVault6022Errors,
    IBaseVault6022States,
    IBaseVault6022Actions
{
}
