"""Leverage API – preview & metrics endpoints"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from decimal import Decimal

from calculations.leverage_engine import process_leverage

# We reuse the in-memory simulation_results dict defined in simulation_api
try:
    from api.simulation_api import simulation_results as _sim_store
except Exception:
    _sim_store = {}

def _get_results(sim_id: str):
    return _sim_store.get(sim_id, {}).get('results')

router = APIRouter(prefix="/api/leverage", tags=["Leverage"])


class LeveragePreviewRequest(BaseModel):
    nav_by_year: Dict[int, float]
    config: Dict[str, Any]


@router.post("/preview")
def leverage_preview(req: LeveragePreviewRequest):
    """Quick, stateless leverage calculation for front-end 'what-if' panels."""
    out = process_leverage({int(k): Decimal(str(v)) for k, v in req.nav_by_year.items()}, req.config)
    return out


@router.get("/metrics/{simulation_id}")
def leverage_metrics(simulation_id: str):
    sim = _get_results(simulation_id)  # to be implemented
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim.get('leverage', {}) 