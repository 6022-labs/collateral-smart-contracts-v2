import { expect } from "chai";
import { ethers } from "hardhat";
import { decodeTokenURI, parseVaultFromVaultCreatedLogs } from "../utils";
import { reset, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  Vault6022,
  Controller6022,
  VaultDescriptor6022,
} from "../../typechain-types";

describe("When getting token URI for vault", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _vault6022: Vault6022;
  let _controller6022: Controller6022;
  let _vaultDescriptor6022: VaultDescriptor6022;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

    const VaultDescriptor6022 = await ethers.getContractFactory(
      "VaultDescriptor6022"
    );
    const vaultDescriptor6022 = await VaultDescriptor6022.deploy();

    await token6022.approve(
      await rewardPool6022.getAddress(),
      ethers.parseEther("100000")
    );

    await token6022.transfer(
      await rewardPool6022.getAddress(),
      lifetimeVaultAmount
    );
    await rewardPool6022.createLifetimeVault(lifetimeVaultAmount);

    await token6022.transfer(
      await rewardPool6022.getAddress(),
      lifetimeVaultAmount
    );
    await rewardPool6022.depositToLifetimeVault();

    const tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      ethers.parseEther("10"),
      await token6022.getAddress(),
      BigInt(0),
      ethers.parseEther("10")
    );
    const txReceipt = await tx.wait();

    const vault6022 = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      vault6022,
      controller6022,
      vaultDescriptor6022,
    };
  }

  beforeEach(async function () {
    const { vault6022, controller6022, vaultDescriptor6022 } =
      await loadFixture(deployVault);

    _vault6022 = vault6022;
    _controller6022 = controller6022;
    _vaultDescriptor6022 = vaultDescriptor6022;
  });

  describe("And no vault descriptor is set", async function () {
    it("Should revert", async function () {
      await expect(_vault6022.tokenURI(1)).to.be.reverted;
    });
  });

  describe("And a vault descriptor is set", async function () {
    beforeEach(async function () {
      await _controller6022.updateVaultDescriptor(
        await _vaultDescriptor6022.getAddress()
      );
    });

    describe("And the token Id does not exist", async function () {
      let _tokenId = 4;

      it("Should revert", async function () {
        await expect(
          _vault6022.tokenURI(_tokenId)
        ).to.be.revertedWithCustomError(_vault6022, "ERC721NonexistentToken");
      });
    });

    describe("And the token Id exists", async function () {
      let _tokenId = 1;

      it("Should return token URI as base 64 encoded JSON", async function () {
        const tokenURI = await _vault6022.tokenURI(_tokenId);

        const parsedTokenURI = decodeTokenURI(tokenURI);
        expect(parsedTokenURI).to.be.an("object");
        expect(parsedTokenURI).to.have.property("name");
        expect(parsedTokenURI).to.have.property("description");
        expect(parsedTokenURI).to.have.property("image");
      });
    });
  });
});
