import { expect } from "chai";
import { ethers } from "hardhat";
import { decodeTokenURI, parseVaultFromVaultCreatedLogs } from "../utils";
import { reset, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  MockERC20,
  CollateralVault,
  CollateralRewardPool,
  CollateralVaultDescriptor,
} from "../../typechain-types";

describe("When building token URI", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;
  const ipfsGateway = "https://ipfs.io/ipfs/";
  const image = "vault-image.png";

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;
  let _vaultDescriptor: CollateralVaultDescriptor;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const CollateralRewardPool = await ethers.getContractFactory(
      "CollateralRewardPool",
    );
    const rewardPool = await CollateralRewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress(),
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    const CollateralVaultDescriptor = await ethers.getContractFactory(
      "CollateralVaultDescriptor",
    );
    const vaultDescriptor = await CollateralVaultDescriptor.deploy(ipfsGateway);

    await token.approve(
      await rewardPool.getAddress(),
      ethers.parseEther("100000"),
    );

    await token.transfer(await rewardPool.getAddress(), lifetimeVaultAmount);
    await rewardPool.createLifetimeVault(lifetimeVaultAmount);

    await token.transfer(await rewardPool.getAddress(), lifetimeVaultAmount);
    await rewardPool.depositToLifetimeVault();

    return {
      token,
      rewardPool,
      vaultDescriptor,
    };
  }

  beforeEach(async function () {
    const { token, rewardPool, vaultDescriptor } = await loadFixture(
      deployVault,
    );

    _token = token;
    _rewardPool = rewardPool;
    _vaultDescriptor = vaultDescriptor;
  });

  describe("And vault name contains svg related characters", function () {
    const vaultName = "CollateralVault \"<>&'`";

    let _vault: CollateralVault;

    beforeEach(async function () {
      const tx = await _rewardPool.createVault(
        vaultName,
        image,
        lockUntil,
        ethers.parseEther("10"),
        await _token.getAddress(),
        BigInt(0),
        ethers.parseEther("10"),
      );
      const txReceipt = await tx.wait();

      _vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
    });

    it("Should contain name property", async function () {
      const tokenURI = await _vaultDescriptor.buildTokenURI(
        await _vault.getAddress(),
        1,
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.name).to.equal(vaultName);
    });

    it("Should contain description property", async function () {
      const tokenURI = await _vaultDescriptor.buildTokenURI(
        await _vault.getAddress(),
        1,
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.description).to.equal("Keys to collateral vaults.");
    });

    it("Should contain image property from IPFS gateway + vault image", async function () {
      const tokenURI = await _vaultDescriptor.buildTokenURI(
        await _vault.getAddress(),
        1,
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.image).to.be.a("string");
      expect(parsed.image).to.equal(`${ipfsGateway}${image}`);
    });
  });

  describe("And vault name does not contains svg related characters", function () {
    const vaultName = "My CollateralVault 6022";

    let _vault: CollateralVault;

    beforeEach(async function () {
      const tx = await _rewardPool.createVault(
        vaultName,
        image,
        lockUntil,
        ethers.parseEther("10"),
        await _token.getAddress(),
        BigInt(0),
        ethers.parseEther("10"),
      );
      const txReceipt = await tx.wait();

      _vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
    });

    it("Should contain name property", async function () {
      const tokenURI = await _vaultDescriptor.buildTokenURI(
        await _vault.getAddress(),
        1,
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.name).to.equal(vaultName);
    });

    it("Should contain description property", async function () {
      const tokenURI = await _vaultDescriptor.buildTokenURI(
        await _vault.getAddress(),
        1,
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.description).to.equal("Keys to collateral vaults.");
    });

    it("Should contain image property from IPFS gateway + vault image", async function () {
      const tokenURI = await _vaultDescriptor.buildTokenURI(
        await _vault.getAddress(),
        1,
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.image).to.be.a("string");
      expect(parsed.image).to.equal(`${ipfsGateway}${image}`);
    });
  });
});
