// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVault} from "./interfaces/IVault.sol";

/// @title Vault — USDC collateral custody for the clearing house.
contract Vault is IVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateral;
    address public clearingHouse;
    address public owner;

    error NotClearingHouse();
    error NotOwner();

    event ClearingHouseSet(address indexed clearingHouse);

    constructor(IERC20 collateral_) {
        collateral = collateral_;
        owner = msg.sender;
    }

    modifier onlyCH() {
        if (msg.sender != clearingHouse) revert NotClearingHouse();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function setClearingHouse(address clearingHouse_) external onlyOwner {
        clearingHouse = clearingHouse_;
        emit ClearingHouseSet(clearingHouse_);
    }

    function pullCollateral(address from, uint256 amount) external onlyCH {
        collateral.safeTransferFrom(from, address(this), amount);
    }

    function pushCollateral(address to, uint256 amount) external onlyCH {
        collateral.safeTransfer(to, amount);
    }

    function balance() external view returns (uint256) {
        return collateral.balanceOf(address(this));
    }
}
