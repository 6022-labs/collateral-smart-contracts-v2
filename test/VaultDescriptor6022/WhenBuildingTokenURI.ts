import { expect } from "chai";
import { ethers } from "hardhat";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { decodeTokenURI, parseVaultFromVaultCreatedLogs } from "../utils";
import { reset, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  MockERC20,
  Vault6022,
  RewardPool6022,
  VaultDescriptor6022,
} from "../../typechain-types";

describe("When building token URI", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: MockERC20;
  let _rewardPool6022: RewardPool6022;
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

    return {
      token6022,
      rewardPool6022,
      vaultDescriptor6022,
    };
  }

  beforeEach(async function () {
    const { token6022, rewardPool6022, vaultDescriptor6022 } =
      await loadFixture(deployVault);

    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;
    _vaultDescriptor6022 = vaultDescriptor6022;
  });

  describe("And vault name contains svg related characters", function () {
    const vaultName = "Vault6022 \"<>&'`";

    let _vault6022: Vault6022;

    beforeEach(async function () {
      const tx = await _rewardPool6022.createVault(
        vaultName,
        lockUntil,
        ethers.parseEther("10"),
        await _token6022.getAddress(),
        BigInt(0),
        ethers.parseEther("10")
      );
      const txReceipt = await tx.wait();

      _vault6022 = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
    });

    it("Should contain name property", async function () {
      const tokenURI = await _vaultDescriptor6022.buildTokenURI(
        await _vault6022.getAddress(),
        1
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.name).to.equal(vaultName);
    });

    it("Should contain description property", async function () {
      const tokenURI = await _vaultDescriptor6022.buildTokenURI(
        await _vault6022.getAddress(),
        1
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.description).to.equal(
        "Keys to collateral vaults at 6022 protocol."
      );
    });

    it("Should contain image property encoded as base64 SVG", async function () {
      const tokenURI = await _vaultDescriptor6022.buildTokenURI(
        await _vault6022.getAddress(),
        1
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.image).to.be.a("string");
      const svg = Buffer.from(parsed.image, "base64").toString("utf-8");

      expect(svg.trim().startsWith("<svg")).to.be.true;

      const validation = XMLValidator.validate(svg);
      expect(validation).to.equal(true);

      const escapedName = vaultName
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      expect(svg).to.contain(escapedName);

      const parser = new XMLParser({ ignoreAttributes: false });
      const parsedSvg = parser.parse(svg);

      expect(parsedSvg).to.have.property("svg");
      expect(parsedSvg.svg).to.be.an("object");
      expect(parsedSvg.svg).to.have.property("defs");
      expect(parsedSvg.svg).to.have.property("g");
    });
  });

  describe("And vault name does not contains svg related characters", function () {
    const vaultName = "My Vault 6022";

    let _vault6022: Vault6022;

    beforeEach(async function () {
      const tx = await _rewardPool6022.createVault(
        vaultName,
        lockUntil,
        ethers.parseEther("10"),
        await _token6022.getAddress(),
        BigInt(0),
        ethers.parseEther("10")
      );
      const txReceipt = await tx.wait();

      _vault6022 = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
    });

    it("Should contain name property", async function () {
      const tokenURI = await _vaultDescriptor6022.buildTokenURI(
        await _vault6022.getAddress(),
        1
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.name).to.equal(vaultName);
    });

    it("Should contain description property", async function () {
      const tokenURI = await _vaultDescriptor6022.buildTokenURI(
        await _vault6022.getAddress(),
        1
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.description).to.equal(
        "Keys to collateral vaults at 6022 protocol."
      );
    });

    it("Should contain image property encoded as base64 SVG", async function () {
      const tokenURI = await _vaultDescriptor6022.buildTokenURI(
        await _vault6022.getAddress(),
        1
      );

      const parsed = decodeTokenURI(tokenURI);
      expect(parsed.image).to.be.a("string");
      const svg = Buffer.from(parsed.image, "base64").toString("utf-8");

      expect(svg.trim().startsWith("<svg")).to.be.true;

      const validation = XMLValidator.validate(svg);
      expect(validation).to.equal(true);

      const parser = new XMLParser({ ignoreAttributes: false });
      const parsedSvg = parser.parse(svg);

      expect(parsedSvg).to.have.property("svg");
      expect(parsedSvg.svg).to.be.an("object");
      expect(parsedSvg.svg).to.have.property("defs");
      expect(parsedSvg.svg).to.have.property("g");
    });
  });
});
