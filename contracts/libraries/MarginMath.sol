// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

library MarginMath {
    function notionalAbs(int256 size, uint256 markPriceX1e6) internal pure returns (uint256) {
        uint256 absSize = size >= 0 ? uint256(size) : uint256(-size);
        return (absSize * markPriceX1e6) / 1e18;
    }

    function passesInitialMargin(uint256 collateral, uint256 notional, uint16 imrBps) internal pure returns (bool) {
        uint256 required = (notional * imrBps) / 10_000;
        return collateral >= required;
    }

    function maintenanceOk(uint256 equity, uint256 notional, uint16 mmrBps) internal pure returns (bool) {
        uint256 required = (notional * mmrBps) / 10_000;
        return equity >= required;
    }

    function unrealizedPnl(int256 size, uint256 entryNotional, uint256 markPriceX1e6) internal pure returns (int256) {
        uint256 absSize = size >= 0 ? uint256(size) : uint256(-size);
        uint256 markNotional = (absSize * markPriceX1e6) / 1e18;
        int256 raw = int256(markNotional) - int256(entryNotional);
        return size >= 0 ? raw : -raw;
    }
}
