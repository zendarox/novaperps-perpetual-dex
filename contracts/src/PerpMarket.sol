// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

/// @title PerpMarket — market config registry (OI caps, leverage, fees).
contract PerpMarket {
    struct Config {
        bytes32 id;
        string symbol;
        uint16 maxLeverage; // e.g. 50
        uint16 takerFeeBps; // 5 = 0.05%
        uint16 makerFeeBps;
        uint256 maxOpenInterest; // notional 1e6
        uint256 openInterestLong;
        uint256 openInterestShort;
        bool listed;
    }

    address public owner;
    address public clearingHouse;
    mapping(bytes32 => Config) public configs;
    bytes32[] public marketIds;

    error NotAuthorized();
    error NotListed();
    error OICap();

    event MarketListed(bytes32 indexed id, string symbol, uint16 maxLeverage);
    event OpenInterestUpdated(bytes32 indexed id, uint256 oiLong, uint256 oiShort);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    function setClearingHouse(address ch) external onlyOwner {
        clearingHouse = ch;
    }

    function listMarket(
        bytes32 id,
        string calldata symbol,
        uint16 maxLeverage,
        uint16 takerFeeBps,
        uint16 makerFeeBps,
        uint256 maxOpenInterest
    ) external onlyOwner {
        require(!configs[id].listed, "exists");
        configs[id] = Config({
            id: id,
            symbol: symbol,
            maxLeverage: maxLeverage,
            takerFeeBps: takerFeeBps,
            makerFeeBps: makerFeeBps,
            maxOpenInterest: maxOpenInterest,
            openInterestLong: 0,
            openInterestShort: 0,
            listed: true
        });
        marketIds.push(id);
        emit MarketListed(id, symbol, maxLeverage);
    }

    function marketCount() external view returns (uint256) {
        return marketIds.length;
    }

    function getMarket(bytes32 id) external view returns (Config memory) {
        return configs[id];
    }

    function adjustOpenInterest(bytes32 id, int256 sizeDelta, uint256 notional) external {
        if (msg.sender != clearingHouse) revert NotAuthorized();
        Config storage c = configs[id];
        if (!c.listed) revert NotListed();
        if (sizeDelta > 0) {
            c.openInterestLong += notional;
            if (c.openInterestLong > c.maxOpenInterest) revert OICap();
        } else if (sizeDelta < 0) {
            c.openInterestShort += notional;
            if (c.openInterestShort > c.maxOpenInterest) revert OICap();
        }
        emit OpenInterestUpdated(id, c.openInterestLong, c.openInterestShort);
    }

    function reduceOpenInterest(bytes32 id, bool wasLong, uint256 notional) external {
        if (msg.sender != clearingHouse) revert NotAuthorized();
        Config storage c = configs[id];
        if (wasLong) {
            c.openInterestLong = notional >= c.openInterestLong ? 0 : c.openInterestLong - notional;
        } else {
            c.openInterestShort = notional >= c.openInterestShort ? 0 : c.openInterestShort - notional;
        }
        emit OpenInterestUpdated(id, c.openInterestLong, c.openInterestShort);
    }
}
