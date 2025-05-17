import pytest
from fastapi.testclient import TestClient

from src.backend.api.main import app
from src.backend.api import simulation_api

client = TestClient(app)

@pytest.fixture
def completed_simulation():
    sim_id = "test-sim"
    simulation_api.simulation_results[sim_id] = {
        "status": "completed",
        "results": {
            "loans": [{"loan_id": "1", "irr": 0.1}],
            "metrics": {"irr": 0.1},
        },
    }
    yield sim_id
    simulation_api.simulation_results.pop(sim_id, None)


def test_get_simulation_loans(completed_simulation):
    resp = client.get(f"/api/simulations/{completed_simulation}/loans/")
    assert resp.status_code == 200
    assert resp.json() == [{"loan_id": "1", "irr": 0.1}]


def test_export_simulation_json(completed_simulation):
    resp = client.get(
        f"/api/simulations/{completed_simulation}/export/",
        params={"format": "json"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["loans"][0]["loan_id"] == "1"


def test_export_simulation_csv(completed_simulation):
    resp = client.get(
        f"/api/simulations/{completed_simulation}/export/",
        params={"format": "csv"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "loan_id" in resp.text
