// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title InsuranceFund — absorbs residual bad debt from liquidations.
contract InsuranceFund {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateral;
    address public clearingHouse;
    address public owner;
    uint256 public balanceTracked;

    error NotAuthorized();

    event Contribution(address indexed from, uint256 amount);
    event Cover(address indexed to, uint256 amount);

    constructor(IERC20 collateral_) {
        collateral = collateral_;
        owner = msg.sender;
    }

    function setClearingHouse(address ch) external {
        if (msg.sender != owner) revert NotAuthorized();
        clearingHouse = ch;
    }

    function contribute(uint256 amount) external {
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        balanceTracked += amount;
        emit Contribution(msg.sender, amount);
    }

    function cover(address to, uint256 amount) external {
        if (msg.sender != clearingHouse) revert NotAuthorized();
        require(balanceTracked >= amount, "IF insolvent");
        balanceTracked -= amount;
        collateral.safeTransfer(to, amount);
        emit Cover(to, amount);
    }
}
