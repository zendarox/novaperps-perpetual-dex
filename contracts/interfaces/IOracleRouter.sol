// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

interface IOracleRouter {
    function markPrice(bytes32 marketId) external view returns (uint256 priceX1e6);
    function indexPrice(bytes32 marketId) external view returns (uint256 priceX1e6);
    function lastUpdate(bytes32 marketId) external view returns (uint64);
}
