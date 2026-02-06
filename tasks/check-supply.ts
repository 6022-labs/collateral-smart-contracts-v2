import { task } from "hardhat/config";

export default task("collateral:check-supply")
  .setDescription("Checks the total supply of the token")
  .addParam("tokenAddress", "The address of the token contract")
  .setAction(async (taskArgs, hre) => {
    let tokenAddress = taskArgs.tokenAddress;

    console.log("Token address: ", tokenAddress);

    let token = await hre.ethers.getContractAt(
      "MockERC20",
      tokenAddress
    );

    let totalSupply = await token.totalSupply();

    console.log("Total supply of token: ", totalSupply.toString());
  });
