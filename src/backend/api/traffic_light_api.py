"""Traffic-Light System API endpoints.

Routes
------
GET /api/traffic-light/zones           – full dataset
GET /api/traffic-light/zones/{zone_id} – single suburb/zone
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from calculations.traffic_light_loader import get_all_zones, get_zone_metrics

router = APIRouter(prefix="/api/traffic-light", tags=["Traffic-Light"])


@router.get("/zones", summary="Full TLS dataset")
def list_zones():
    """Return the entire Traffic-Light dataset as a list."""
    return get_all_zones()


@router.get("/zones/{zone_id}", summary="Get a single zone by id")
def get_zone(zone_id: str):
    """Return one suburb/zone record or *404* if not found."""
    try:
        return get_zone_metrics(zone_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Zone not found") 