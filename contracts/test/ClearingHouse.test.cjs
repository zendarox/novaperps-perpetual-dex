const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

function marketId(symbol) {
  return ethers.id(symbol);
}

describe("NovaPerps ClearingHouse", function () {
  async function deployFixture() {
    const [deployer, alice, bob, liquidator] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await usdc.getAddress());

    const OracleRouter = await ethers.getContractFactory("OracleRouter");
    const oracle = await OracleRouter.deploy();

    const PerpMarket = await ethers.getContractFactory("PerpMarket");
    const markets = await PerpMarket.deploy();

    const FundingRate = await ethers.getContractFactory("FundingRate");
    const funding = await FundingRate.deploy(await oracle.getAddress());

    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const ch = await ClearingHouse.deploy(
      await vault.getAddress(),
      await oracle.getAddress(),
      await markets.getAddress(),
      await funding.getAddress()
    );

    const InsuranceFund = await ethers.getContractFactory("InsuranceFund");
    const insurance = await InsuranceFund.deploy(await usdc.getAddress());
    await insurance.setClearingHouse(await ch.getAddress());
    await ch.setInsuranceFund(await insurance.getAddress());

    const LiquidationEngine = await ethers.getContractFactory("LiquidationEngine");
    const liq = await LiquidationEngine.deploy(await ch.getAddress());

    await vault.setClearingHouse(await ch.getAddress());
    await markets.setClearingHouse(await ch.getAddress());

    const btc = marketId("BTC-PERP");
    await markets.listMarket(btc, "BTC-PERP", 50, 5, 2, ethers.parseUnits("50000000", 6));
    await oracle.setPrices(btc, 65000_000000n, 64950_000000n); // 1e6

    const mintAmt = ethers.parseUnits("1000000", 6);
    await usdc.mint(alice.address, mintAmt);
    await usdc.mint(bob.address, mintAmt);
    await usdc.connect(alice).approve(await vault.getAddress(), mintAmt);
    await usdc.connect(bob).approve(await vault.getAddress(), mintAmt);

    return { usdc, vault, oracle, markets, funding, ch, insurance, liq, deployer, alice, bob, liquidator, btc };
  }

  it("deposits collateral and opens a long", async function () {
    const { ch, alice, btc } = await deployFixture();
    await ch.connect(alice).deposit(ethers.parseUnits("10000", 6));
    // 0.1 BTC at 65k = 6500 USDC notional; 2% IM = 130
    const size = ethers.parseUnits("0.1", 18);
    await ch.connect(alice).openPosition(btc, size, 0);
    const pos = await ch.getPosition(alice.address, btc);
    expect(pos.size).to.equal(size);
    const view = await ch.accountView(alice.address);
    expect(view.collateral).to.be.lt(ethers.parseUnits("10000", 6));
    expect(view.equity).to.be.gt(0n);
  });

  it("rejects open without margin", async function () {
    const { ch, alice, btc } = await deployFixture();
    await ch.connect(alice).deposit(ethers.parseUnits("10", 6));
    const size = ethers.parseUnits("1", 18); // 65k notional needs 1300 IM
    await expect(ch.connect(alice).openPosition(btc, size, 0)).to.be.reverted;
  });

  it("closes a position and realizes pnl on price move", async function () {
    const { ch, oracle, alice, btc } = await deployFixture();
    await ch.connect(alice).deposit(ethers.parseUnits("20000", 6));
    await ch.connect(alice).openPosition(btc, ethers.parseUnits("0.2", 18), 0);
    await oracle.setPrices(btc, 70000_000000n, 69900_000000n);
    const before = await ch.collateralOf(alice.address);
    await ch.connect(alice).closePosition(btc, 0);
    const after = await ch.collateralOf(alice.address);
    const pos = await ch.getPosition(alice.address, btc);
    expect(pos.size).to.equal(0);
    expect(after).to.be.gt(before); // long profit roughly credited on close
  });

  it("updates funding and settles on next trade", async function () {
    const { ch, funding, oracle, alice, btc } = await deployFixture();
    await ch.connect(alice).deposit(ethers.parseUnits("20000", 6));
    await ch.connect(alice).openPosition(btc, ethers.parseUnits("0.1", 18), 0);
    await time.increase(3600);
    // refresh oracle after time travel (staleness guard)
    await oracle.setPrices(btc, 66000_000000n, 65000_000000n);
    await funding.updateFunding(btc);
    const rate = await funding.lastRate(btc);
    expect(rate).to.not.equal(0n);
    await ch.connect(alice).openPosition(btc, ethers.parseUnits("0.01", 18), 0);
  });

  it("liquidates underwater account via LiquidationEngine", async function () {
    const { ch, oracle, liq, alice, liquidator, btc } = await deployFixture();
    await ch.connect(alice).deposit(ethers.parseUnits("1500", 6));
    // ~65k notional, IM 2% = 1300, deposit 1500 — ok
    await ch.connect(alice).openPosition(btc, ethers.parseUnits("1", 18), 0);
    // crash mark so equity < MMR
    await oracle.setPrices(btc, 60000_000000n, 60000_000000n);
    expect(await ch.isLiquidatable(alice.address)).to.equal(true);
    await liq.connect(liquidator).liquidate(alice.address, btc);
    const pos = await ch.getPosition(alice.address, btc);
    expect(pos.size).to.equal(0);
  });

  it("respects slippage limitPrice", async function () {
    const { ch, alice, btc } = await deployFixture();
    await ch.connect(alice).deposit(ethers.parseUnits("10000", 6));
    await expect(
      ch.connect(alice).openPosition(btc, ethers.parseUnits("0.1", 18), 64000_000000n)
    ).to.be.revertedWithCustomError(ch, "Slippage");
  });
});
