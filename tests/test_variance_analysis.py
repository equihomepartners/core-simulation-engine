import time
from fastapi.testclient import TestClient
from src.backend.api.main import app
from tests.test_headless_backend_full import FULL_CONFIG

client = TestClient(app)


def wait_for_completion(sim_id: str, timeout: float = 30):
    deadline = time.time() + timeout
    while True:
        status_resp = client.get(f"/api/simulations/{sim_id}/status")
        assert status_resp.status_code == 200, status_resp.text
        status = status_resp.json()
        if status["status"] == "completed":
            return
        if status["status"] == "failed":
            raise AssertionError(f"Simulation failed: {status}")
        if time.time() > deadline:
            raise TimeoutError("Simulation did not complete in time")
        time.sleep(0.5)


def test_variance_analysis_endpoint():
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]
    wait_for_completion(sim_id)

    var_resp = client.post(
        f"/api/simulations/{sim_id}/variance-analysis",
        params={"num_inner_simulations": 2, "include_seed_details": True},
    )
    assert var_resp.status_code == 200, var_resp.text
    data = var_resp.json()
    assert "irr_percentiles" in data
    assert "var_percentiles" in data
    assert "seed_details" in data
    assert isinstance(data["seed_details"], list)


def test_variance_seed_results_endpoint():
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]
    wait_for_completion(sim_id)

    seeds_resp = client.get(
        f"/api/simulations/{sim_id}/variance-analysis/seeds",
        params={"num_inner_simulations": 2},
    )
    assert seeds_resp.status_code == 200, seeds_resp.text
    seeds = seeds_resp.json()
    assert isinstance(seeds, list)
    assert len(seeds) == 2


def test_variance_distribution_endpoint():
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]
    wait_for_completion(sim_id)

    dist_resp = client.get(
        f"/api/simulations/{sim_id}/variance-analysis/distribution",
        params={"num_inner_simulations": 2, "bins": 5},
    )
    assert dist_resp.status_code == 200, dist_resp.text
    dist = dist_resp.json()
    assert set(dist.keys()) == {"bins", "frequencies"}



def test_variance_iteration_endpoint():
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]
    wait_for_completion(sim_id)

    iter_resp = client.get(
        f"/api/simulations/{sim_id}/variance-analysis/iterations",
        params={"num_inner_simulations": 2, "limit": 1},
    )
    assert iter_resp.status_code == 200, iter_resp.text
    iterations = iter_resp.json()
    assert isinstance(iterations, list)
    assert len(iterations) == 1


def test_variance_var_table_endpoint():
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]
    wait_for_completion(sim_id)

    var_resp = client.get(
        f"/api/simulations/{sim_id}/variance-analysis/var-table",
        params={"num_inner_simulations": 2, "confidence_levels": "0.9"},
    )
    assert var_resp.status_code == 200, var_resp.text
    table = var_resp.json()
    assert "value_at_risk" in table


def test_efficient_frontier_details_endpoint():
    resp = client.post("/api/simulations", json=FULL_CONFIG)
    assert resp.status_code == 200, resp.text
    sim_id = resp.json()["simulation_id"]
    wait_for_completion(sim_id)

    opt_resp = client.post(
        "/api/optimization",
        json={"risk_free_rate": 0.02, "generate_efficient_frontier": True},
    )
    assert opt_resp.status_code == 200, opt_resp.text
    opt_id = opt_resp.json()["optimization_id"]
    # Wait for completion
    deadline = time.time() + 30
    while True:
        status = client.get(f"/api/optimization/{opt_id}/status")
        assert status.status_code == 200, status.text
        if status.json()["status"] == "completed":
            break
        if time.time() > deadline:
            raise TimeoutError("Optimization did not complete")
        time.sleep(0.5)

    details_resp = client.get(
        f"/api/optimization/{opt_id}/efficient-frontier/details"
    )
    assert details_resp.status_code == 200, details_resp.text
    details = details_resp.json()
    assert isinstance(details, list)

