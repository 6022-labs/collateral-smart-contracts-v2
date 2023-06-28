import { expect } from "chai";
import { ethers } from "hardhat";
import {
  time,
  reset,
  setBalance,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

//-----------------------------------------------------------------------------
// DON'T USE LOAD FIXTURES INTO THIS TEST FILE
//----------------------------------------------------------------------------

describe("Collection6022", function () {
  const totalSupply = ethers.parseUnits("5", 16);

  const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // WMATIC from the forked network

  async function deployCollectionWithWMaticFixture() {
    await reset("https://polygon.llamarpc.com", 44204379);

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Collection6022 = await ethers.getContractFactory("Collection6022");
    const collection6022 = await Collection6022.deploy(
      "Test Collection 6022",
      WMATIC_ADDRESS,
      WMATIC_ADDRESS
    );

    const wMatic = await ethers.getContractAt("ERC20", WMATIC_ADDRESS);

    return { collection6022, wMatic, owner, otherAccount };
  }

  async function deployCollectionWithTokenFixture() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(totalSupply);

    const Collection6022 = await ethers.getContractFactory("Collection6022");
    const collection6022 = await Collection6022.deploy(
      "Test Collection 6022",
      await token6022.getAddress(),
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" // WMATIC from the forked network
    );

    return { collection6022, token6022, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should work", async function () {
      const { collection6022 } = await deployCollectionWithTokenFixture();

      expect(await collection6022.isLocked()).to.be.false;
    });
  });

  describe("Deposit token", function () {
    it("Should fail when insufficient allowance", async function () {
      const { collection6022 } = await deployCollectionWithTokenFixture();

      await expect(collection6022.depositToken(1000)).be.revertedWith(
        "ERC20: insufficient allowance"
      );
    });

    it("Should fail when contract is locked", async function () {
      const { collection6022, token6022 } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      await expect(collection6022.depositToken(1000)).be.revertedWith(
        "The contract is locked, a deposit has already been made"
      );
    });

    it("Should fail when wanted to deposit ethers", async function () {
      const { collection6022 } = await deployCollectionWithTokenFixture();

      await expect(
        collection6022.depositEther({ value: 1000 })
      ).to.be.revertedWith("Ether deposit not allowed, token is not WETH");
    });

    it("Should work when sufficient allowance", async function () {
      const { collection6022, token6022, owner } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      expect(
        await token6022.balanceOf(await collection6022.getAddress())
      ).to.equal(1000);

      expect(await collection6022.isLocked()).to.be.true;
      expect(await collection6022.balanceOf(owner.address)).to.equal(3);
    });
  });

  describe("Withdraw token", function () {
    it("Should fail when insufficient deposit", async function () {
      const { collection6022, token6022 } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      await expect(collection6022.withdraw(1001)).to.be.revertedWith(
        "Not enough tokens to withdraw"
      );
    });

    it("Should fail when only 1 NFT in stored period", async function () {
      const { collection6022, token6022, otherAccount } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);
      await collection6022.transferMultiple(otherAccount);

      await expect(collection6022.withdraw(1000)).to.be.revertedWith(
        "Not enough NFTs to withdraw"
      );
    });

    it("Should work while not transfer NFTs", async function () {
      const { collection6022, token6022, owner } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);
      await collection6022.withdraw(1000);

      expect(await token6022.balanceOf(owner.address)).to.equal(totalSupply);
    });

    it("Should work directly for the new owner", async function () {
      const { collection6022, token6022, otherAccount } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);
      await collection6022.transferMultiple(otherAccount);

      await expect(collection6022.connect(otherAccount).withdraw(1000)).to.not
        .be.reverted;

      expect(await token6022.balanceOf(otherAccount.address)).to.equal(1000);
    });

    it("Should work for the old owner after stored period", async function () {
      const { collection6022, token6022, otherAccount } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);
      await collection6022.transferMultiple(otherAccount);

      await time.increase(time.duration.days(30 * 36 + 1));

      await expect(collection6022.withdraw(1000)).to.not.be.reverted;
    });
  });

  describe("Transfer multiple from owner to other account", function () {
    it("Should fail if not owner", async function () {
      const { collection6022, token6022, otherAccount } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      await expect(
        collection6022.connect(otherAccount).transferMultiple(otherAccount)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should fail when no deposit", async function () {
      const { collection6022, otherAccount } =
        await deployCollectionWithTokenFixture();

      // First call should work
      await expect(
        collection6022.transferMultiple(otherAccount)
      ).be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should transfer 2 NFT when token deposit is done", async function () {
      const { collection6022, token6022, owner, otherAccount } =
        await deployCollectionWithTokenFixture();

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      await collection6022.transferMultiple(otherAccount);

      expect(await collection6022.balanceOf(owner.address)).to.equal(1);
      expect(await collection6022.balanceOf(otherAccount.address)).to.equal(2);
    });

    it("Should transfer 2 NFT when ether deposit is done", async function () {
      const { collection6022, owner, otherAccount } =
        await deployCollectionWithWMaticFixture();

      await collection6022.depositEther({ value: 1000 });

      await collection6022.transferMultiple(otherAccount);

      expect(await collection6022.balanceOf(owner.address)).to.equal(1);
      expect(await collection6022.balanceOf(otherAccount.address)).to.equal(2);
    });
  });

  describe("Deposit ethers", function () {
    it("Should fail when insufficient balance", async function () {
      const { collection6022, owner } =
        await deployCollectionWithWMaticFixture();

      await setBalance(owner.address, 999);

      await expect(collection6022.depositEther({ value: 1000 })).to.be.rejected;
    });

    it("Should fail when locked", async function () {
      const { collection6022 } = await deployCollectionWithWMaticFixture();

      expect(await collection6022.depositEther({ value: 1000 })).not.be
        .reverted;

      expect(await collection6022.isLocked()).to.be.true;

      await expect(
        collection6022.depositEther({ value: 1000 })
      ).to.be.rejectedWith(
        "The contract is locked, a deposit has already been made"
      );

      await expect(collection6022.depositToken(1000)).to.be.rejectedWith(
        "The contract is locked, a deposit has already been made"
      );
    });

    it("Should work when sufficient balance and not locked", async function () {
      const { collection6022, owner } =
        await deployCollectionWithWMaticFixture();

      expect(await collection6022.depositEther({ value: 1000 })).not.be
        .reverted;

      expect(await collection6022.isLocked()).to.be.true;
      expect(await collection6022.balanceOf(owner.address)).to.equal(3);

      expect(
        await ethers.provider.getBalance(await collection6022.getAddress())
      ).to.equal(1000);
    });
  });

  describe("Withdraw ethers", function () {
    it("Should fail when contract does not accept ether", async function () {
      const { collection6022 } = await deployCollectionWithTokenFixture();

      await expect(collection6022.withdrawEther(1000)).to.be.revertedWith(
        "Ether withdrawals only allowed when token is WETH"
      );
    });

    it("Should fail when insufficient deposit | Part 1", async function () {
      const { collection6022 } = await deployCollectionWithWMaticFixture();

      await collection6022.depositEther({ value: 1000 });

      await expect(collection6022.withdrawEther(1001)).to.be.revertedWith(
        "Not enough ethers to withdraw"
      );
    });

    it("Should fail when insufficient deposit | Part 2", async function () {
      const { collection6022 } = await deployCollectionWithWMaticFixture();

      await collection6022.depositEther({ value: 1000 });

      await expect(collection6022.withdrawEther(500)).not.be.reverted;
      await expect(collection6022.withdrawEther(501)).to.be.revertedWith(
        "Not enough ethers to withdraw"
      );
    });

    it("Should fail when only 1 NFT in stored period | Part 1", async function () {
      const { collection6022, otherAccount } =
        await deployCollectionWithWMaticFixture();

      await collection6022.depositEther({ value: 1000 });
      await collection6022.transferMultiple(otherAccount);

      await expect(collection6022.withdrawEther(1000)).to.be.revertedWith(
        "Not enough NFTs to withdraw"
      );
    });

    it("Should fail when only 1 NFT in stored period | Part 2", async function () {
      const { collection6022, otherAccount } =
        await deployCollectionWithWMaticFixture();

      await collection6022.depositEther({ value: 1000 });
      await collection6022.transferMultiple(otherAccount);

      // Just before the end of the period
      await time.increase(time.duration.days(30 * 36 - 1));

      await expect(collection6022.withdrawEther(1000)).to.be.revertedWith(
        "Not enough NFTs to withdraw"
      );
    });

    it("Should work while not transfer NFTs", async function () {
      const { collection6022, owner } =
        await deployCollectionWithWMaticFixture();

      let tenEthers = ethers.parseEther("10");
      await collection6022.depositEther({ value: tenEthers });

      await setBalance(owner.address, tenEthers);

      await expect(collection6022.withdrawEther(tenEthers)).not.be.reverted;

      // Cannot use "equal" balance because of gas fees
      expect(await ethers.provider.getBalance(owner.address)).to.above(
        tenEthers
      );
    });

    it("Should work directly for the new owner", async function () {
      const { collection6022, otherAccount } =
        await deployCollectionWithWMaticFixture();

      let tenEthers = ethers.parseEther("10");
      await collection6022.depositEther({ value: tenEthers });
      await collection6022.transferMultiple(otherAccount);

      await setBalance(otherAccount.address, tenEthers);

      await expect(
        collection6022.connect(otherAccount).withdrawEther(tenEthers)
      ).not.be.reverted;

      // Cannot use "equal" balance because of gas fees
      expect(await ethers.provider.getBalance(otherAccount.address)).to.above(
        tenEthers
      );
    });

    it("Should work for the old owner after stored period", async function () {
      const { collection6022, otherAccount } =
        await deployCollectionWithWMaticFixture();

      let tenEthers = ethers.parseEther("10");
      await collection6022.depositEther({ value: tenEthers });
      await collection6022.transferMultiple(otherAccount);

      await time.increase(time.duration.days(30 * 36 + 1));

      await expect(collection6022.withdrawEther(tenEthers)).not.be.reverted;
    });
  });
});
