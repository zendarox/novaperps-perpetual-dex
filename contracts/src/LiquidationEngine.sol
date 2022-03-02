// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {ClearingHouse} from "./ClearingHouse.sol";

/// @title LiquidationEngine — permissionless liquidations for underwater accounts.
contract LiquidationEngine {
    ClearingHouse public immutable clearingHouse;

    event Liquidated(address indexed account, bytes32 indexed marketId, address indexed liquidator, uint256 penalty);

    constructor(ClearingHouse clearingHouse_) {
        clearingHouse = clearingHouse_;
    }

    function liquidate(address account, bytes32 marketId) external {
        require(clearingHouse.isLiquidatable(account), "healthy");
        uint256 penalty = clearingHouse.liquidateFromEngine(account, marketId, msg.sender);
        emit Liquidated(account, marketId, msg.sender, penalty);
    }

    function canLiquidate(address account) external view returns (bool) {
        return clearingHouse.isLiquidatable(account);
    }
}
