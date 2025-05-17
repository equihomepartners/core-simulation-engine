"""LeverageEngine – minimal first-pass implementation

Supports Phase 1 of the leverage roadmap: a single NAV facility on the
fund's Green-zone sleeve.  Subsequent phases (deal notes, ramp line,
A+ over-advance, dynamic rules) will extend this file.

Design goals for v0:
• Pure function → easy unit-test.
• No external deps – relies only on `Decimal`, `Dict`.
• Adds two outputs:
    – `leverage_cash_flows` per year (dict year→interest, commitment_fee)
    – `leverage_metrics` summary (avg_ratio, max_drawn, total_int)

Downstream consumers:
• `SimulationController` stores both objects under results['leverage'].
• `CashFlows` unchanged – we tack the interest line item onto cash_flows
  inside this engine to avoid circular imports.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Dict, Any, List
import copy

DECIMAL_100 = Decimal("100")


def _annual_interest(draw: Decimal, spread_bps: int) -> Decimal:
    """Simple interest expense for the year (no amortisation)."""
    return draw * Decimal(spread_bps) / (DECIMAL_100 * Decimal("100"))


def _commitment_fee(limit: Decimal, utilised: Decimal, fee_bps: int) -> Decimal:
    unused = limit - utilised
    return unused * Decimal(fee_bps) / (DECIMAL_100 * Decimal("100"))


def process_leverage(
    nav_by_year: Dict[int, Decimal],
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """Compute leverage cash-flows & metrics for all configured facilities.

    Currently supports:
        • Green-sleeve NAV facility (max_mult × NAV).
        • Ramp line (commitment-linked, limited draw period).
        • Deal-level note (note_pct of NAV, flat rate).
        • A+ over-advance (adds to green facility limit).

    The logic is intentionally *simple* – we assume facilities are fully drawn
    whenever enabled.  This gets the economics into the simulation so UI work
    can proceed; refinements (partial utilisation, repayments) can follow.
    """

    lev_block = config.get("leverage", {})

    # -------------------------------------------------
    # Optional Dynamic Rules – list of dicts [{rule...}]
    # Each rule can specify:
    #   start_year (inclusive), end_year (exclusive)
    #   plus any override keys under leverage.* path, e.g.
    #   {"start_year":1, "end_year":2, "green_sleeve.max_mult":1.25}
    # A missing end_year means rule applies indefinitely.
    # -------------------------------------------------
    dyn_rules = lev_block.get("dynamic_rules", [])

    # Guard: if leverage completely disabled, short-circuit
    if not lev_block or (not lev_block.get("green_sleeve") and not dyn_rules):
        return {"cash_flows": {}, "metrics": {}}

    def _apply_dyn_overrides(base_cfg: Dict[str, Any], yr: int) -> Dict[str, Any]:
        """Return a deep-copied leverage cfg with any rule overrides for *yr*."""
        cfg = copy.deepcopy(base_cfg)
        for rule in dyn_rules:
            start = int(rule.get("start_year", 0))
            end = rule.get("end_year", None)
            if yr < start:
                continue
            if end is not None and yr >= int(end):
                continue
            # apply overrides – keys use dotted path leverage.<block>.<field>
            for k, v in rule.items():
                if k in ("start_year", "end_year"):
                    continue
                # split path and drill down
                parts = k.split(".")
                node = cfg
                for p in parts[:-1]:
                    node = node.setdefault(p, {})
                node[parts[-1]] = v
        return cfg

    fund_size = Decimal(str(config.get("fund_size", 0)))

    # --------------------------
    # Green-sleeve NAV facility
    # --------------------------
    gs_cfg = lev_block.get("green_sleeve", {})
    gs_enabled = gs_cfg.get("enabled", False)
    max_mult = Decimal(str(gs_cfg.get("max_mult", 1.0)))
    gs_spread = int(gs_cfg.get("spread_bps", 250))
    gs_fee = int(gs_cfg.get("commitment_fee_bps", 0))

    # --------------------
    # Ramp warehouse line
    # --------------------
    rl_cfg = lev_block.get("ramp_line", {})
    rl_enabled = rl_cfg.get("enabled", False)
    rl_limit_pct = Decimal(str(rl_cfg.get("limit_pct_commit", 0.15)))
    rl_draw_months = int(rl_cfg.get("draw_period_months", 24))
    rl_draw_years = rl_draw_months / 12.0
    rl_spread = int(rl_cfg.get("spread_bps", 300))

    # ---------------
    # Deal-level note
    # ---------------
    dn_cfg = lev_block.get("deal_note", {})
    dn_enabled = dn_cfg.get("enabled", False)
    dn_pct = Decimal(str(dn_cfg.get("note_pct", 0.3)))
    dn_rate = Decimal(str(dn_cfg.get("note_rate", 0.07)))  # decimal (e.g. 0.07 == 7 %)

    # -------------------
    # A+ over-advance cap
    # -------------------
    oa_cfg = lev_block.get("a_plus_overadvance", {})
    oa_enabled = oa_cfg.get("enabled", False)
    oa_adv_rate = Decimal(str(oa_cfg.get("advance_rate", 0.75)))
    # We do not yet have loan-level TLS grade mix; assume 10 % of NAV for A+ sleeve
    oa_nav_share = Decimal("0.1")  # placeholder until real mix is plumbed-in

    cash: Dict[int, Dict[str, Decimal]] = {}
    total_interest = Decimal("0")
    total_drawn = Decimal("0")
    max_drawn = Decimal("0")

    for yr, nav in nav_by_year.items():
        yr_interest = Decimal("0")
        yr_fee = Decimal("0")

        # Apply year-specific overrides if dynamic_rules present
        if dyn_rules:
            # re-extract facility params from the overridden cfg
            lev_cfg_yr = _apply_dyn_overrides(lev_block, yr)
            gs_cfg = lev_cfg_yr.get("green_sleeve", {})
            gs_enabled = gs_cfg.get("enabled", False)
            max_mult = Decimal(str(gs_cfg.get("max_mult", 1.0)))
            gs_spread = int(gs_cfg.get("spread_bps", 250))
            gs_fee = int(gs_cfg.get("commitment_fee_bps", 0))

            rl_cfg = lev_cfg_yr.get("ramp_line", {})
            rl_enabled = rl_cfg.get("enabled", False)
            rl_limit_pct = Decimal(str(rl_cfg.get("limit_pct_commit", 0.15)))
            rl_draw_months = int(rl_cfg.get("draw_period_months", 24))
            rl_draw_years = rl_draw_months / 12.0
            rl_spread = int(rl_cfg.get("spread_bps", 300))

            dn_cfg = lev_cfg_yr.get("deal_note", {})
            dn_enabled = dn_cfg.get("enabled", False)
            dn_pct = Decimal(str(dn_cfg.get("note_pct", 0.3)))
            dn_rate = Decimal(str(dn_cfg.get("note_rate", 0.07)))

            oa_cfg = lev_cfg_yr.get("a_plus_overadvance", {})
            oa_enabled = oa_cfg.get("enabled", False)
            oa_adv_rate = Decimal(str(oa_cfg.get("advance_rate", 0.75)))
        # else keep original params above

        # --- Green facility ---
        if gs_enabled:
            gs_limit = nav * max_mult
            # Over-advance bumps the limit on eligible NAV
            if oa_enabled:
                oa_extra = nav * oa_nav_share * oa_adv_rate
                gs_limit += oa_extra
            gs_draw = gs_limit  # assume fully drawn
            yr_interest += _annual_interest(gs_draw, gs_spread)
            yr_fee += _commitment_fee(gs_limit, gs_draw, gs_fee)
            total_drawn += gs_draw
            if gs_draw > max_drawn:
                max_drawn = gs_draw

        # --- Ramp line (only during deployment window) ---
        if rl_enabled and yr < rl_draw_years:
            rl_limit = fund_size * rl_limit_pct
            rl_draw = rl_limit  # assume maxed during deployment
            yr_interest += _annual_interest(rl_draw, rl_spread)
            # commitment fee not common for ramp lines – skip.
            total_drawn += rl_draw
            if rl_draw > max_drawn:
                max_drawn = rl_draw

        # --- Deal note (pseudo-aggregate) ---
        if dn_enabled:
            dn_draw = nav * dn_pct
            yr_interest += dn_draw * dn_rate  # flat rate times principal
            total_drawn += dn_draw
            if dn_draw > max_drawn:
                max_drawn = dn_draw

        cash[yr] = {"interest": yr_interest, "commitment_fee": yr_fee}
        total_interest += yr_interest + yr_fee

    avg_leverage = (total_drawn / sum(nav_by_year.values())) if nav_by_year else Decimal("0")

    metrics = {
        "avg_leverage": float(avg_leverage),
        "max_drawn": float(max_drawn),
        "total_interest": float(total_interest),
    }

    return {"cash_flows": cash, "metrics": metrics} 