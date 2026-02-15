# AGENTS.md

## Project Overview

Smart-contract suite for the Collateral Protocol. The repository contains Solidity contracts for controllers, reward pools, vaults, factories, plus TypeScript-based Hardhat tasks and tests.

Key technologies:

- Solidity 0.8.28
- Hardhat 2.28 with Ignition
- Ethers v6
- OpenZeppelin Contracts v5
- TypeScript (ES2020, CommonJS, strict)

Repository structure:

- contracts/: Solidity sources (interfaces, enums, structs, librairies, mocks)
- test/: TypeScript tests organized by contract domain
- tasks/: Hardhat tasks
- ignition/: Hardhat Ignition modules and parameters

## Setup Commands

- Install dependencies: `npm install`
- Create `.env` and fill required values used in `hardhat.config.ts`:
  - `PRIVATE_KEY`
  - `RPC_URL_POLYGON`
  - `RPC_URL_AMOY_TESTNET`
  - `RPC_URL_CITREA_TESTNET`
  - `RPC_URL_CITREA`
  - `ETHERSCAN_API_KEY`

## Development Workflow

- Compile contracts: `npx hardhat compile`
- Run tests: `npx hardhat test`
- Gas report: enabled by default in hardhat config and writes to gas-report-matic.txt when tests run
- List tasks: `npx hardhat --help`
- Run a task: `npx hardhat <task-name> --network <network> --<param> <value>` (see tasks/)
- Deploy via Ignition (always verify by default):
  - `npx hardhat ignition deploy ./ignition/modules/CollateralController.ts --network <MY_NETWORK> --verify`
  - `npx hardhat ignition deploy ./ignition/modules/CollateralControllerWithExistingDescriptor.ts --network <MY_NETWORK> --parameters ignition/parameters/<MY_NETWORK>/CollateralControllerWithExistingDescriptor.json --verify`
  - `npx hardhat ignition deploy ./ignition/modules/CollateralRewardPoolFactory.ts --network <MY_NETWORK> --parameters ignition/parameters/<MY_NETWORK>/CollateralRewardPoolFactory.json --verify`
  - `npx hardhat ignition deploy ./ignition/modules/CollateralRewardPoolFactoryWithExistingController.ts --network <MY_NETWORK> --parameters ignition/parameters/<MY_NETWORK>/CollateralRewardPoolFactoryWithExistingController.json --verify`

## Testing Instructions

- Run all tests: `npx hardhat test`
- Test files: `test/**` (TypeScript)
- Naming pattern: domain folders such as `test/CollateralController/WhenAddingAdmin.ts`
- Assertions: Chai `expect` with Hardhat custom errors (see existing tests)
- Fixtures: `loadFixture` and `reset` from `@nomicfoundation/hardhat-toolbox/network-helpers`

## Code Style Guidelines

### Solidity

- SPDX + pragma header:
  - `// SPDX-License-Identifier: MIT`
  - `pragma solidity ^0.8.28;`
- Use named imports with braces.
- Keep section headers used in existing contracts:
  - `// ----------------- CONST ----------------- //`
  - `// ----------------- VARIABLES ----------------- //`
  - `// ----------------- MODIFIERS ----------------- //`
  - `// ----------------- FUNCS ----------------- //`
- Prefer custom errors and events declared in interface files under contracts/interfaces/.
- Use OpenZeppelin `AccessControl` or `Ownable` as already used.
- Keep contract, interface, and file naming consistent with existing `Collateral...`/`ICollateral...` patterns.

### TypeScript

- ES2020 target, CommonJS modules, strict mode.
- Use TypeChain types from typechain-types.
- Prefer BigInt for amounts in tests.

## Build and Deployment

- Build artifacts: `npx hardhat compile` (outputs to artifacts/)
- Ignition deployments are defined in ignition/modules and use parameters in ignition/parameters.
- Network configuration is in hardhat.config.ts and depends on .env values.

## Security Considerations

- Do not commit secrets: PRIVATE_KEY and API keys must remain local.
- Use .env for network URLs and keys.
- Hardhat config enables `viaIR` and optimizer; keep new Solidity code compatible with these settings.

## Pull Request Guidelines

- Run tests before committing: `npx hardhat test`
- Keep changes consistent with existing structure and patterns.

## Debugging and Troubleshooting

- If deployments fail, verify network URLs and keys in .env.
- If gas reports are missing, ensure tests ran and check gas-report-matic.txt.
