import pytest
from fastapi.testclient import TestClient

from src.backend.api.main import app

client = TestClient(app)

# Placeholder aggregation function until real implementation is available

def run_config_mc(simulations):
    """Aggregate simple IRR and multiple across simulation configs."""
    irr_avg = sum(sim.get("irr", 0) for sim in simulations) / len(simulations)
    mult_avg = sum(sim.get("multiple", 0) for sim in simulations) / len(simulations)
    return {"irr": irr_avg, "multiple": mult_avg}


def test_run_config_mc_aggregation():
    sims = [
        {"irr": 0.1, "multiple": 1.1},
        {"irr": 0.2, "multiple": 1.3},
    ]
    agg = run_config_mc(sims)
    assert pytest.approx(0.15) == agg["irr"]
    assert pytest.approx(1.2) == agg["multiple"]


def test_inner_monte_carlo_endpoint_structure():
    resp = client.get(
        "/api/simulations/dummy-sim/monte-carlo/visualization",
        params={"chart_type": "distribution", "format": "irr"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) >= {"labels", "datasets", "statistics"}
