// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {IOracleRouter} from "./interfaces/IOracleRouter.sol";

/// @title FundingRate — premium → capped hourly funding index.
contract FundingRate {
    IOracleRouter public immutable oracle;
    address public owner;
    address public keeper;

    int256 public constant MAX_RATE_1e18 = 0.001e18; // 0.1% per interval
    uint256 public interval = 1 hours;

    struct MarketFunding {
        int256 cumulativeIndex; // 1e18 scale
        uint64 lastUpdate;
        int256 lastRate; // 1e18
    }

    mapping(bytes32 => MarketFunding) public funding;

    error NotAuthorized();

    event FundingUpdated(bytes32 indexed marketId, int256 rate, int256 cumulativeIndex);

    constructor(IOracleRouter oracle_) {
        oracle = oracle_;
        owner = msg.sender;
        keeper = msg.sender;
    }

    function setKeeper(address k) external {
        if (msg.sender != owner) revert NotAuthorized();
        keeper = k;
    }

    /// @notice Crank funding from mark/index premium. Permissionless after interval.
    function updateFunding(bytes32 marketId) external returns (int256 rate) {
        MarketFunding storage f = funding[marketId];
        require(block.timestamp >= uint256(f.lastUpdate) + interval || f.lastUpdate == 0, "too soon");

        uint256 mark = oracle.markPrice(marketId);
        uint256 index = oracle.indexPrice(marketId);
        // premium = (mark - index) / index
        int256 premium = (int256(mark) - int256(index)) * 1e18 / int256(index);
        rate = premium / 24; // dampen toward hourly
        if (rate > MAX_RATE_1e18) rate = MAX_RATE_1e18;
        if (rate < -MAX_RATE_1e18) rate = -MAX_RATE_1e18;

        f.cumulativeIndex += rate;
        f.lastRate = rate;
        f.lastUpdate = uint64(block.timestamp);
        emit FundingUpdated(marketId, rate, f.cumulativeIndex);
    }

    function cumulativeIndex(bytes32 marketId) external view returns (int256) {
        return funding[marketId].cumulativeIndex;
    }

    function lastRate(bytes32 marketId) external view returns (int256) {
        return funding[marketId].lastRate;
    }
}
