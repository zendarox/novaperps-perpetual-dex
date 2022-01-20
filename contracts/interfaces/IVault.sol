// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

interface IVault {
    function pullCollateral(address from, uint256 amount) external;
    function pushCollateral(address to, uint256 amount) external;
}
