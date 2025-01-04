# 6022 Protocol

## 0. Install

To use the project you must install hardhat package:

```bash
npm install -g hardhat
```

## 1. Deploy

To deploy you can use tasks that are already defined in the tasks folder. To deploy the contract you can use the following command:

```bash
npx hardhat deploy-everything --total-supply <supply> --minter <minter-address> --network <network>
```

To only deploy a contract generator and assign it to a existing controller :

```bash
npx hardhat deploy-factory --controller-6022-address <controller-address> --token-6022-address <token-address> --network <network>
```

## 2. Documentation

Here the link to the documentation written by Unblocked team :

https://lofty-pyramid-206.notion.site/Documentation-97ff50ea2f694e09ab437af3a22cbfdd?pvs=4

## 3. Tests

To run the tests you can use the following command:

```bash
npx hardhat test
```
