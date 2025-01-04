import { task } from "hardhat/config";

export default task("check-supply")
  .addParam("token6022", "The address of the Token6022 contract")
  .setAction(async (taskArgs, hre) => {
    let token6022Address = taskArgs.token6022;

    console.log("Token6022 address: ", token6022Address);

    let token6022 = await hre.ethers.getContractAt(
      "Token6022",
      token6022Address
    );

    let totalSupply = await token6022.totalSupply();

    console.log("Total supply of Token6022: ", totalSupply.toString());
  });
