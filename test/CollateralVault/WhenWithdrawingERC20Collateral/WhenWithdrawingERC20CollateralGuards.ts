import { expect } from "chai";
import {
  depositCollateral,
  deployDefaultVault,
  ERC20WithdrawTestSuite,
} from "./common";

describe("When withdrawing ERC20 collateral (guards)", function () {
  let suite: ERC20WithdrawTestSuite;

  beforeEach(async function () {
    suite = await deployDefaultVault();
  });

  describe("Given collateral is not deposited", async function () {
    it("Should revert with 'NotDeposited' error", async function () {
      await expect(suite.vault.withdraw()).to.be.revertedWithCustomError(
        suite.vault,
        "NotDeposited",
      );
    });
  });

  describe("Given collateral is deposited", async function () {
    beforeEach(async function () {
      await depositCollateral(suite);
    });

    describe("But collateral is already withdrawn", async function () {
      beforeEach(async function () {
        await suite.vault.withdraw();
      });

      it("Should revert with 'AlreadyWithdrawn' error", async function () {
        await expect(suite.vault.withdraw()).to.be.revertedWithCustomError(
          suite.vault,
          "AlreadyWithdrawn",
        );
      });
    });
  });
});
