import addresses from "../abi/addresses.json";
import abis from "../abi/abis.json";

export const ADDR = addresses as {
  chainId: number;
  MockUSDC: `0x${string}`;
  Vault: `0x${string}`;
  OracleRouter: `0x${string}`;
  ClearingHouse: `0x${string}`;
  LiquidationEngine: `0x${string}`;
  markets: Record<string, `0x${string}`>;
};

export const ABI = abis as Record<string, readonly unknown[]>;

export const HAS_DEPLOY =
  !!ADDR.ClearingHouse &&
  ADDR.ClearingHouse !== "0x0000000000000000000000000000000000000000";
