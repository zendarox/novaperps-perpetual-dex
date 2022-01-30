// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {IOracleRouter} from "./interfaces/IOracleRouter.sol";

/// @title OracleRouter — settable mark/index prices for local sim + keeper feeds.
contract OracleRouter is IOracleRouter {
    struct Feed {
        uint256 markX1e6;
        uint256 indexX1e6;
        uint64 updatedAt;
    }

    address public owner;
    mapping(address => bool) public keepers;
    mapping(bytes32 => Feed) public feeds;
    uint64 public maxStaleness = 3600;

    error NotAuthorized();
    error StalePrice();
    error ZeroPrice();

    event PriceUpdated(bytes32 indexed marketId, uint256 mark, uint256 index, uint64 ts);
    event KeeperSet(address indexed keeper, bool allowed);

    constructor() {
        owner = msg.sender;
        keepers[msg.sender] = true;
    }

    modifier onlyKeeper() {
        if (!keepers[msg.sender] && msg.sender != owner) revert NotAuthorized();
        _;
    }

    function setKeeper(address keeper, bool allowed) external {
        if (msg.sender != owner) revert NotAuthorized();
        keepers[keeper] = allowed;
        emit KeeperSet(keeper, allowed);
    }

    function setPrices(bytes32 marketId, uint256 markX1e6, uint256 indexX1e6) external onlyKeeper {
        if (markX1e6 == 0 || indexX1e6 == 0) revert ZeroPrice();
        feeds[marketId] = Feed({markX1e6: markX1e6, indexX1e6: indexX1e6, updatedAt: uint64(block.timestamp)});
        emit PriceUpdated(marketId, markX1e6, indexX1e6, uint64(block.timestamp));
    }

    function markPrice(bytes32 marketId) external view returns (uint256) {
        Feed memory f = feeds[marketId];
        if (f.markX1e6 == 0) revert ZeroPrice();
        if (block.timestamp > uint256(f.updatedAt) + maxStaleness) revert StalePrice();
        return f.markX1e6;
    }

    function indexPrice(bytes32 marketId) external view returns (uint256) {
        Feed memory f = feeds[marketId];
        if (f.indexX1e6 == 0) revert ZeroPrice();
        if (block.timestamp > uint256(f.updatedAt) + maxStaleness) revert StalePrice();
        return f.indexX1e6;
    }

    function lastUpdate(bytes32 marketId) external view returns (uint64) {
        return feeds[marketId].updatedAt;
    }
}
