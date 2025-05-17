from decimal import Decimal
from src.backend.calculations.gp_entity import GPEntity

def _make_gp(freq: str) -> GPEntity:
    return GPEntity({
        "dividend_policy": {
            "enabled": True,
            "type": "percentage",
            "percentage": 0.5,
            "frequency": freq,
            "start_year": 1,
        },
        "initial_cash_reserve": 0,
        "management_company": {},
        "expenses": [],
    })

BASIC_ECON = {
    "yearly_management_fees": {"1": Decimal("1200")},
    "yearly_carried_interest": {"1": Decimal("0")},
    "yearly_distributions": {"1": Decimal("0")},
    "yearly_origination_fees": {"1": Decimal("0")},
}

MGMT_METRICS = {
    "yearly_additional_revenue": {"1": Decimal("0")},
    "yearly_expenses": {"1": Decimal("0")},
    "yearly_aum": {"1": Decimal("0")},
    "yearly_fund_count": {"1": 0},
    "yearly_loan_count": {"1": 0},
}

def test_quarterly_dividends():
    gp = _make_gp("quarterly")
    cashflows = gp._generate_monthly_cashflows(BASIC_ECON, MGMT_METRICS)
    expected_months = {"1-03", "1-06", "1-09", "1-12"}
    for month in range(1, 13):
        key = f"1-{month:02d}"
        div = cashflows[key]["dividend"]
        if key in expected_months:
            assert div == 150
        else:
            assert div == 0
    assert cashflows["1-12"]["cash_reserve"] == 600


def test_annual_dividends():
    gp = _make_gp("annual")
    cashflows = gp._generate_monthly_cashflows(BASIC_ECON, MGMT_METRICS)
    for month in range(1, 12):
        key = f"1-{month:02d}"
        assert cashflows[key]["dividend"] == 0
    assert cashflows["1-12"]["dividend"] == 600
    assert cashflows["1-12"]["cash_reserve"] == 600

