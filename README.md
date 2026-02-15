# Collateral Protocol Contracts

Smart contract suite for the collateral protocol (Controller, VaultDescriptor, RewardPoolFactory, RewardPool, Vault).

## Requirements

- Node.js + npm
- A `.env` file with the network values used in `hardhat.config.ts`
- For live networks, `PRIVATE_KEY` must be set

Supported network names:

- `polygon`
- `citrea`
- `amoy-testnet`
- `citrea-testnet`

## Install

```bash
npm install
```

## Build And Test

```bash
npx hardhat compile
npx hardhat test
```

## Deployment (Ignition)

Use one of these deployment paths depending on your setup.

### Path A: New RewardPoolFactory + New Controller + New VaultDescriptor

This module deploys factory and reuses `CollateralController` module setup.

Set `tokenAddress` in:

- `ignition/parameters/<NETWORK>/CollateralRewardPoolFactory.json`

Then deploy:

```bash
npx hardhat ignition deploy ./ignition/modules/CollateralRewardPoolFactory.ts --network <NETWORK> --parameters ignition/parameters/<NETWORK>/CollateralRewardPoolFactory.json --verify
```

### Path B: New RewardPoolFactory + Existing Controller

Set values in:

- `ignition/parameters/<NETWORK>/CollateralRewardPoolFactoryWithExistingController.json`
  - `collateralControllerAddress`
  - `tokenAddress`

Then deploy:

```bash
npx hardhat ignition deploy ./ignition/modules/CollateralRewardPoolFactoryWithExistingController.ts --network <NETWORK> --parameters ignition/parameters/<NETWORK>/CollateralRewardPoolFactoryWithExistingController.json --verify
```

## Important Notes

- Replace any `"tbd"` placeholder in parameter files before deploying.
- If you deploy with an existing controller, ensure admin permissions are configured as expected for later setup actions.

## Hardhat Tasks

Project tasks are under `tasks/`.

To list all registered tasks:

```bash
npx hardhat --help
```

## Documentation

[Documentation](https://lofty-pyramid-206.notion.site/Documentation-97ff50ea2f694e09ab437af3a22cbfdd?pvs=4)
