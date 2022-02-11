// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice 6-decimal collateral token for local simulation & tests.
contract MockUSDC is ERC20 {
    constructor() ERC20("Nova USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
