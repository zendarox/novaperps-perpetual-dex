// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.28;

import {IOracleRouter} from "./interfaces/IOracleRouter.sol";
import {IVault} from "./interfaces/IVault.sol";
import {MarginMath} from "./libraries/MarginMath.sol";
import {PerpMarket} from "./PerpMarket.sol";
import {FundingRate} from "./FundingRate.sol";
import {InsuranceFund} from "./InsuranceFund.sol";

/// @title ClearingHouse — cross-margin perps clearing for NovaPerps.
contract ClearingHouse {
    struct Position {
        int256 size;
        uint256 entryNotional;
        int256 lastFundingIndex;
    }

    struct AccountView {
        uint256 collateral;
        int256 unrealizedPnl;
        uint256 equity;
        uint256 usedMargin;
    }

    IVault public immutable vault;
    IOracleRouter public immutable oracle;
    PerpMarket public immutable markets;
    FundingRate public immutable funding;
    InsuranceFund public insuranceFund;

    address public owner;
    uint16 public imrBps = 200; // 2% → 50x
    uint16 public mmrBps = 100;
    uint16 public liqPenaltyBps = 50;

    mapping(address => uint256) public collateralOf;
    mapping(address => mapping(bytes32 => Position)) internal _positions;
    mapping(address => bytes32[]) internal _accountMarkets;
    mapping(address => mapping(bytes32 => bool)) internal _hasMarket;

    event CollateralDeposited(address indexed account, uint256 amount);
    event CollateralWithdrawn(address indexed account, uint256 amount);
    event PositionChanged(
        address indexed account,
        bytes32 indexed marketId,
        int256 sizeDelta,
        uint256 execPrice,
        uint256 fee,
        int256 realizedPnl
    );
    event FundingPaid(address indexed account, bytes32 indexed marketId, int256 payment);

    error InsufficientMargin();
    error ZeroSize();
    error Slippage();
    error NotListed();
    error Healthy();
    error Flat();

    constructor(IVault vault_, IOracleRouter oracle_, PerpMarket markets_, FundingRate funding_) {
        vault = vault_;
        oracle = oracle_;
        markets = markets_;
        funding = funding_;
        owner = msg.sender;
    }

    function setInsuranceFund(InsuranceFund if_) external {
        require(msg.sender == owner, "owner");
        insuranceFund = if_;
    }

    function deposit(uint256 amount) external {
        vault.pullCollateral(msg.sender, amount);
        collateralOf[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _settleAllFunding(msg.sender);
        require(freeCollateral(msg.sender) >= amount, "free collateral");
        collateralOf[msg.sender] -= amount;
        vault.pushCollateral(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, amount);
    }

    /// @notice Open, increase, reduce, or flip a position by `sizeDelta` (+long / -short).
    function openPosition(bytes32 marketId, int256 sizeDelta, uint256 limitPrice) public {
        if (sizeDelta == 0) revert ZeroSize();
        PerpMarket.Config memory cfg = markets.getMarket(marketId);
        if (!cfg.listed) revert NotListed();

        _settleFunding(msg.sender, marketId);

        uint256 mark = oracle.markPrice(marketId);
        if (limitPrice != 0) {
            bool isBuy = sizeDelta > 0;
            if (isBuy ? mark > limitPrice : mark < limitPrice) revert Slippage();
        }

        Position storage p = _positions[msg.sender][marketId];
        int256 realized;
        uint256 fee;

        if (p.size == 0) {
            _trackMarket(msg.sender, marketId);
            uint256 notional = MarginMath.notionalAbs(sizeDelta, mark);
            fee = (notional * cfg.takerFeeBps) / 10_000;
            p.size = sizeDelta;
            p.entryNotional = notional;
            p.lastFundingIndex = funding.cumulativeIndex(marketId);
            markets.adjustOpenInterest(marketId, sizeDelta, notional);
        } else if ((p.size > 0) == (sizeDelta > 0)) {
            // increase
            uint256 notional = MarginMath.notionalAbs(sizeDelta, mark);
            fee = (notional * cfg.takerFeeBps) / 10_000;
            p.size += sizeDelta;
            p.entryNotional += notional;
            markets.adjustOpenInterest(marketId, sizeDelta, notional);
        } else {
            // reduce or flip
            uint256 closeUnits = _min(_abs(sizeDelta), _abs(p.size));
            uint256 entrySlice = (p.entryNotional * closeUnits) / _abs(p.size);
            realized = MarginMath.unrealizedPnl(
                p.size > 0 ? int256(closeUnits) : -int256(closeUnits),
                entrySlice,
                mark
            );
            fee = (MarginMath.notionalAbs(int256(closeUnits), mark) * cfg.takerFeeBps) / 10_000;

            bool wasLong = p.size > 0;
            markets.reduceOpenInterest(marketId, wasLong, entrySlice);

            if (_abs(sizeDelta) < _abs(p.size)) {
                p.size += sizeDelta;
                p.entryNotional -= entrySlice;
            } else if (_abs(sizeDelta) == _abs(p.size)) {
                p.size = 0;
                p.entryNotional = 0;
            } else {
                // flip
                int256 rem = sizeDelta + p.size;
                p.size = 0;
                p.entryNotional = 0;
                uint256 n2 = MarginMath.notionalAbs(rem, mark);
                fee += (n2 * cfg.takerFeeBps) / 10_000;
                p.size = rem;
                p.entryNotional = n2;
                p.lastFundingIndex = funding.cumulativeIndex(marketId);
                markets.adjustOpenInterest(marketId, rem, n2);
            }
        }

        _applyPnlAndFee(msg.sender, realized, fee);
        require(MarginMath.passesInitialMargin(equity(msg.sender), _accountNotional(msg.sender), imrBps), "IM");
        emit PositionChanged(msg.sender, marketId, sizeDelta, mark, fee, realized);
    }

    function closePosition(bytes32 marketId, uint256 limitPrice) external {
        Position storage p = _positions[msg.sender][marketId];
        if (p.size == 0) revert Flat();
        openPosition(marketId, -p.size, limitPrice);
    }

    function getPosition(address account, bytes32 marketId) external view returns (Position memory) {
        return _positions[account][marketId];
    }

    function getAccountMarkets(address account) external view returns (bytes32[] memory) {
        return _accountMarkets[account];
    }

    function equity(address account) public view returns (uint256) {
        int256 eq = int256(collateralOf[account]) + unrealizedPnl(account);
        return eq > 0 ? uint256(eq) : 0;
    }

    function unrealizedPnl(address account) public view returns (int256 pnl) {
        bytes32[] memory mids = _accountMarkets[account];
        for (uint256 i; i < mids.length; i++) {
            Position memory p = _positions[account][mids[i]];
            if (p.size == 0) continue;
            pnl += MarginMath.unrealizedPnl(p.size, p.entryNotional, oracle.markPrice(mids[i]));
        }
    }

    function freeCollateral(address account) public view returns (uint256) {
        uint256 eq = equity(account);
        uint256 required = (_accountNotional(account) * imrBps) / 10_000;
        return eq > required ? eq - required : 0;
    }

    function isLiquidatable(address account) public view returns (bool) {
        uint256 notional = _accountNotional(account);
        if (notional == 0) return false;
        return !MarginMath.maintenanceOk(equity(account), notional, mmrBps);
    }

    function accountView(address account) external view returns (AccountView memory v) {
        v.collateral = collateralOf[account];
        v.unrealizedPnl = unrealizedPnl(account);
        v.equity = equity(account);
        v.usedMargin = (_accountNotional(account) * imrBps) / 10_000;
    }

    function liquidateFromEngine(address account, bytes32 marketId, address liquidator)
        external
        returns (uint256 penalty)
    {
        if (!isLiquidatable(account)) revert Healthy();
        Position storage p = _positions[account][marketId];
        if (p.size == 0) revert Flat();

        _settleFunding(account, marketId);
        uint256 mark = oracle.markPrice(marketId);
        uint256 notional = MarginMath.notionalAbs(p.size, mark);
        int256 pnl = MarginMath.unrealizedPnl(p.size, p.entryNotional, mark);
        penalty = (notional * liqPenaltyBps) / 10_000;

        markets.reduceOpenInterest(marketId, p.size > 0, notional);
        int256 closed = p.size;
        p.size = 0;
        p.entryNotional = 0;

        int256 eq = int256(collateralOf[account]) + pnl - int256(penalty);
        if (eq >= 0) {
            collateralOf[account] = uint256(eq);
            collateralOf[liquidator] += penalty;
        } else {
            collateralOf[account] = 0;
            if (address(insuranceFund) != address(0) && penalty > 0) {
                // best-effort; may revert if IF empty — catch by requiring balance off-chain
            }
        }

        emit PositionChanged(account, marketId, -closed, mark, penalty, pnl);
    }

    function _applyPnlAndFee(address account, int256 realized, uint256 fee) internal {
        if (realized > 0) collateralOf[account] += uint256(realized);
        if (realized < 0) {
            uint256 loss = uint256(-realized);
            require(collateralOf[account] >= loss + fee, "pnl");
            collateralOf[account] -= loss;
        }
        require(collateralOf[account] >= fee, "fee");
        collateralOf[account] -= fee;
    }

    function _accountNotional(address account) internal view returns (uint256 n) {
        bytes32[] memory mids = _accountMarkets[account];
        for (uint256 i; i < mids.length; i++) {
            Position memory p = _positions[account][mids[i]];
            if (p.size == 0) continue;
            n += MarginMath.notionalAbs(p.size, oracle.markPrice(mids[i]));
        }
    }

    function _trackMarket(address account, bytes32 marketId) internal {
        if (!_hasMarket[account][marketId]) {
            _hasMarket[account][marketId] = true;
            _accountMarkets[account].push(marketId);
        }
    }

    function _settleAllFunding(address account) internal {
        bytes32[] memory mids = _accountMarkets[account];
        for (uint256 i; i < mids.length; i++) {
            _settleFunding(account, mids[i]);
        }
    }

    function _settleFunding(address account, bytes32 marketId) internal {
        Position storage p = _positions[account][marketId];
        int256 idx = funding.cumulativeIndex(marketId);
        if (p.size == 0) {
            p.lastFundingIndex = idx;
            return;
        }
        int256 delta = idx - p.lastFundingIndex;
        if (delta == 0) return;
        uint256 mark = oracle.markPrice(marketId);
        int256 payment = (p.size * delta / 1e18) * int256(mark) / 1e18;
        if (payment > 0) {
            uint256 pay = uint256(payment);
            if (pay > collateralOf[account]) pay = collateralOf[account];
            collateralOf[account] -= pay;
        } else if (payment < 0) {
            collateralOf[account] += uint256(-payment);
        }
        p.lastFundingIndex = idx;
        emit FundingPaid(account, marketId, payment);
    }

    function _abs(int256 x) internal pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
