const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function marketId(symbol) {
  return hre.ethers.id(symbol);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();

  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(await usdc.getAddress());

  const OracleRouter = await hre.ethers.getContractFactory("OracleRouter");
  const oracle = await OracleRouter.deploy();

  const PerpMarket = await hre.ethers.getContractFactory("PerpMarket");
  const markets = await PerpMarket.deploy();

  const FundingRate = await hre.ethers.getContractFactory("FundingRate");
  const funding = await FundingRate.deploy(await oracle.getAddress());

  const ClearingHouse = await hre.ethers.getContractFactory("ClearingHouse");
  const ch = await ClearingHouse.deploy(
    await vault.getAddress(),
    await oracle.getAddress(),
    await markets.getAddress(),
    await funding.getAddress()
  );

  const InsuranceFund = await hre.ethers.getContractFactory("InsuranceFund");
  const insurance = await InsuranceFund.deploy(await usdc.getAddress());
  await insurance.setClearingHouse(await ch.getAddress());
  await ch.setInsuranceFund(await insurance.getAddress());

  const LiquidationEngine = await hre.ethers.getContractFactory("LiquidationEngine");
  const liq = await LiquidationEngine.deploy(await ch.getAddress());

  await vault.setClearingHouse(await ch.getAddress());
  await markets.setClearingHouse(await ch.getAddress());

  const specs = [
    { symbol: "BTC-PERP", mark: 65000_000000n, index: 64980_000000n, lev: 50, oi: 50_000_000n * 1_000_000n },
    { symbol: "ETH-PERP", mark: 3500_000000n, index: 3498_000000n, lev: 50, oi: 40_000_000n * 1_000_000n },
    { symbol: "SOL-PERP", mark: 145_000000n, index: 144_800000n, lev: 25, oi: 20_000_000n * 1_000_000n },
    { symbol: "ARB-PERP", mark: 1_200000n, index: 1_195000n, lev: 20, oi: 10_000_000n * 1_000_000n },
  ];

  for (const s of specs) {
    const id = marketId(s.symbol);
    await markets.listMarket(id, s.symbol, s.lev, 5, 2, s.oi);
    await oracle.setPrices(id, s.mark, s.index);
  }

  // Seed deployer with USDC for demo
  await usdc.mint(deployer.address, hre.ethers.parseUnits("10000000", 6));
  await usdc.approve(await vault.getAddress(), hre.ethers.MaxUint256);

  const addresses = {
    chainId: 31337,
    MockUSDC: await usdc.getAddress(),
    Vault: await vault.getAddress(),
    OracleRouter: await oracle.getAddress(),
    PerpMarket: await markets.getAddress(),
    FundingRate: await funding.getAddress(),
    ClearingHouse: await ch.getAddress(),
    InsuranceFund: await insurance.getAddress(),
    LiquidationEngine: await liq.getAddress(),
    markets: Object.fromEntries(specs.map((s) => [s.symbol, marketId(s.symbol)])),
    deployer: deployer.address,
  };

  const outDir = path.join(__dirname, "..", "..", "packages", "console", "src", "abi");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "addresses.json"), JSON.stringify(addresses, null, 2));

  // export minimal ABIs
  const names = [
    "MockUSDC",
    "Vault",
    "OracleRouter",
    "PerpMarket",
    "FundingRate",
    "ClearingHouse",
    "InsuranceFund",
    "LiquidationEngine",
  ];
  const abis = {};
  for (const n of names) {
    const art = await hre.artifacts.readArtifact(n);
    abis[n] = art.abi;
  }
  fs.writeFileSync(path.join(outDir, "abis.json"), JSON.stringify(abis, null, 2));

  console.log(JSON.stringify(addresses, null, 2));
  console.log("Wrote packages/console/src/abi/addresses.json + abis.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
