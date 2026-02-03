import { expect } from "chai";
import { ethers } from "hardhat";
import { decodeTokenURI, parseVaultFromVaultCreatedLogs } from "../utils";
import { reset, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  Vault,
  Controller,
  VaultDescriptor,
} from "../../typechain-types";

describe("When getting token URI for vault", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _vault: Vault;
  let _controller: Controller;
  let _vaultDescriptor: VaultDescriptor;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    const RewardPool = await ethers.getContractFactory("RewardPool");
    const rewardPool = await RewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    const VaultDescriptor = await ethers.getContractFactory(
      "VaultDescriptor"
    );
    const vaultDescriptor = await VaultDescriptor.deploy();

    await token.approve(
      await rewardPool.getAddress(),
      ethers.parseEther("100000")
    );

    await token.transfer(
      await rewardPool.getAddress(),
      lifetimeVaultAmount
    );
    await rewardPool.createLifetimeVault(lifetimeVaultAmount);

    await token.transfer(
      await rewardPool.getAddress(),
      lifetimeVaultAmount
    );
    await rewardPool.depositToLifetimeVault();

    const tx = await rewardPool.createVault(
      "Vault",
      lockUntil,
      ethers.parseEther("10"),
      await token.getAddress(),
      BigInt(0),
      ethers.parseEther("10")
    );
    const txReceipt = await tx.wait();

    const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      vault,
      controller,
      vaultDescriptor,
    };
  }

  beforeEach(async function () {
    const { vault, controller, vaultDescriptor } =
      await loadFixture(deployVault);

    _vault = vault;
    _controller = controller;
    _vaultDescriptor = vaultDescriptor;
  });

  describe("And no vault descriptor is set", async function () {
    it("Should revert", async function () {
      await expect(_vault.tokenURI(1)).to.be.reverted;
    });
  });

  describe("And a vault descriptor is set", async function () {
    beforeEach(async function () {
      await _controller.updateVaultDescriptor(
        await _vaultDescriptor.getAddress()
      );
    });

    describe("And the token Id does not exist", async function () {
      let _tokenId = 4;

      it("Should revert", async function () {
        await expect(
          _vault.tokenURI(_tokenId)
        ).to.be.revertedWithCustomError(_vault, "ERC721NonexistentToken");
      });
    });

    describe("And the token Id exists", async function () {
      let _tokenId = 1;

      it("Should return token URI as base 64 encoded JSON", async function () {
        const tokenURI = await _vault.tokenURI(_tokenId);

        const parsedTokenURI = decodeTokenURI(tokenURI);
        expect(parsedTokenURI).to.be.an("object");
        expect(parsedTokenURI).to.have.property("name");
        expect(parsedTokenURI).to.have.property("description");
        expect(parsedTokenURI).to.have.property("image");
      });
    });
  });
});
