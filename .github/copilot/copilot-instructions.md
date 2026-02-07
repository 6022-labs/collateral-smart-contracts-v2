# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Use the exact language/framework/library versions found in the repo.
2. **Context Files**: Prioritize any files in .github/copilot (this file, and any future additions).
3. **Codebase Patterns**: When guidance is missing, scan existing contracts/tests/tasks for patterns.
4. **Architectural Consistency**: Keep the modular smart-contract suite structure (controllers, pools, vaults, interfaces, libs, tasks, tests).
5. **Code Quality**: Prioritize maintainability, performance, security, and testability as demonstrated in existing code.

## Technology Version Detection

Detected from the repository:

- **Solidity**: 0.8.28 (see hardhat.config.ts). Always use `pragma solidity ^0.8.28;` and avoid features outside 0.8.28.
- **TypeScript**: 5.9.3 (package.json), target ES2020, module CommonJS, strict mode on (tsconfig.json).
- **Hardhat**: ^2.28.0 with Hardhat Toolbox and Ignition.
- **Ethers**: ^6.16.0.
- **OpenZeppelin Contracts**: ^5.4.0.
- **TypeChain**: ^8.3.2 with ethers v6 bindings.
- **Testing**: Mocha + Chai, Hardhat network helpers.

## Codebase Structure & Architecture

Observed structure (do not deviate):

- `contracts/`: Solidity smart contracts.
  - Subfolders: `interfaces/`, `enums/`, `structs/`, `librairies/`, `mocks/`.
- `test/`: TypeScript tests organized by contract domain (e.g., `CollateralController/`), using `describe`/`it`.
- `tasks/`: Hardhat tasks with `task().setDescription().addParam().setAction()` pattern.
- `ignition/`: Ignition modules & parameters.

The codebase is a modular smart-contract suite with controllers, reward pools, vaults, and factories. Keep responsibilities split across contracts and interfaces, and reuse interface segments for errors/events/states/actions.

## Solidity Code Patterns

Follow these patterns exactly as seen in contracts:

- **Header**:
  - SPDX line then pragma, then imports.
  - Example from contracts uses:
    - `// SPDX-License-Identifier: MIT`
    - `pragma solidity ^0.8.28;`
- **Imports**:
  - Use named imports with braces: `import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";`.
- **Layout & Section Comments**:
  - Use section headers like:
    - `// ----------------- CONST ----------------- //`
    - `// ----------------- VARIABLES ----------------- //`
    - `// ----------------- MODIFIERS ----------------- //`
    - `// ----------------- FUNCS ----------------- //`
- **State & Constants**:
  - Constants are uppercase or descriptive: `FEES_PERCENT`, `MAX_TOKENS`.
  - State variables use `camelCase`.
- **Custom Errors & Events**:
  - Errors and events are declared in interface files under `contracts/interfaces/...`.
  - Contracts revert using custom errors, e.g. `revert NotEnoughNFTToWithdraw();`.
- **Interfaces Composition**:
  - Interfaces are composed from smaller interfaces (states, errors, events, actions), see `contracts/interfaces/ICollateralRewardPool/ICollateralRewardPool.sol`.
- **Access Control**:
  - Use OpenZeppelin `AccessControl` or `Ownable` as existing contracts do.
  - Roles are `bytes32 public constant` using `keccak256("ROLE")`.
- **Reentrancy**:
  - Where applicable, use `ReentrancyGuard` and `nonReentrant` modifier like `CollateralVault`.
- **Naming**:
  - Contract names use `Collateral...` prefixes.
  - Interfaces use `ICollateral...` prefixes.
- **Behavior**:
  - Use `require`-like logic via custom errors and modifiers.
  - Keep vault/reward-pool actions consistent with existing pool/vault patterns.

## TypeScript / Hardhat Patterns

- **Tests**:
  - Use `describe`/`it` from Mocha and `expect` from Chai.
  - Use Hardhat `ethers` and typechain types from `typechain-types`.
  - Use `loadFixture` and `reset` from `@nomicfoundation/hardhat-toolbox/network-helpers`.
  - Prefer `BigInt` for amounts (see test/utils.ts).
- **Tasks**:
  - Use default export `task("namespace:name")`.
  - Use the `collateral:*` namespace for task names.
  - Use `.setDescription()`, `.addParam()` and `.setAction()`.
  - Use `hre.ethers.getContractAt` and wait for receipts with status checks.

- **Ignition Modules**:
  - Keep module names aligned with current deployment paths:
    - `CollateralController`
    - `CollateralControllerWithExistingDescriptor`
    - `CollateralRewardPoolFactory`
    - `CollateralRewardPoolFactoryWithExistingController`
    - `CollateralVaultDescriptor`
  - When wiring controller setup, ensure `updateVaultDescriptor` is part of the deployment flow.
  - Keep parameter keys explicit and consistent, e.g. `collateralControllerAddress`, `collateralVaultDescriptorAddress`, `tokenAddress`.

## Documentation Requirements

- Solidity contracts use brief NatSpec-style comments for contracts and some public functions.
- Match the existing comment density and style; avoid adding excessive documentation.

## Testing Approach

- Unit/integration tests exist in TypeScript under `test/`.
- Mirror the existing describe structure (e.g., `describe("When ...", ...)`) and expect-based assertions with custom error checks.
- When adding new functionality, add tests alongside existing suite structure.

## General Best Practices

- Preserve existing file organization and naming conventions.
- Prefer consistency with current patterns over external best practices.
- Do not introduce new tooling or frameworks unless already present in `package.json`.
- Do not change solidity version or compiler settings without updating `hardhat.config.ts` and matching patterns.

## Project-Specific Guidance

- Reuse existing interfaces in `contracts/interfaces/` for errors/events/states/actions instead of defining them inline.
- Keep factories/controllers/vaults/reward-pools responsibilities consistent with existing flows.
- Use `viaIR`-compatible Solidity code patterns (no reliance on undefined behavior) and maintain optimizer assumptions.
- Keep deployment docs and parameter JSON files synchronized with Ignition module changes.
- In CLI docs and examples, include `--verify` on Ignition deploy commands by default.
