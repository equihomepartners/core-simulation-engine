# Equihome Fund Simulation Engine

## Overview

The Equihome Fund Simulation Engine is a sophisticated financial modeling system designed to simulate and optimize real estate investment portfolios. It focuses on modeling a 10-year loan product for single-family properties with no monthly payments, incorporating advanced financial calculations, Monte Carlo simulations, and portfolio optimization techniques.

The system serves as both a standalone simulation tool and an integrated component within Equihome's broader platform ecosystem, particularly connecting with the Traffic Light System, Portfolio Management System (PMS), and Underwriting System to enable data-driven decision making.

## Key Features

- **Fund Modeling**: Comprehensive modeling of fund parameters, fee structures, and loan characteristics
- **Portfolio Generation**: Generation of simulated loan portfolios with realistic distributions
- **Monte Carlo Simulations**: Risk analysis through thousands of simulated scenarios
- **Efficient Frontier Optimization**: Portfolio optimization to maximize returns for given risk levels
- **Real-time Data Integration**: Connection to live data sources for up-to-date modeling
- **Automated Recommendations**: AI-driven portfolio optimization suggestions
- **Institutional-Grade UI**: Bank-level interface with extensive configuration options
- **Comprehensive Reporting**: Detailed analysis of all financial metrics and risk indicators

## Advanced Analytics & Data Catalogue  (New)

The v2 Monte-Carlo + Stress-Test layer now exposes a rich JSON payload for risk, convergence and factor attribution metrics.  UI implementation details live in:

* [`docs/frontend/ADVANCED_VISUALIZATION_GUIDE.md`](docs/frontend/ADVANCED_VISUALIZATION_GUIDE.md) – step-by-step guide for charts and page layout.
* [`docs/frontend/PARAMETER_TRACKING.md`](docs/frontend/PARAMETER_TRACKING.md) – exhaustive list of every config key (including new MC variable-draw schema).

Back-end modules powering these features:

| Module | Purpose |
|--------|---------|
| `calculations.monte_carlo` | MC driver, convergence curves, efficient frontier, factor betas |
| `calculations.risk_decomposition` | OLS attribution of IRR to varied inputs |
| `calculations.stress_testing` | Scenario generator + impact heat-map data |

All results are returned under `results.monte_carlo_results` and `results.stress_test_results` in the API response.

## Documentation

- [Complete Backend Documentation](docs/architecture/BACKEND_CALCULATIONS_COMPLETE.md) - Comprehensive backend calculation documentation
- [Architecture Overview](docs/architecture/ARCHITECTURE.md) - Detailed system architecture
- [Frontend Documentation](docs/architecture/FRONTEND.md) - Frontend architecture and guidelines
- [Mathematical Models](docs/architecture/MATHEMATICAL_MODELS.md) - Financial calculations and models
- [API Documentation](docs/api/API_DOCUMENTATION.md) - API endpoints and usage
- [WebSocket Protocol](docs/api/WEBSOCKET_PROTOCOL.md) - WebSocket communication protocol
- [Integration Guide](docs/guides/INTEGRATION_GUIDE.md) - Guide for integrating with other systems

## Updated Dependencies (v2)

### Backend – Python (poetry/requirements.txt)

| Package | Purpose |
|---------|---------|
| fastapi >=0.110 | REST & WebSocket API layer |
| uvicorn[standard] >=0.29 | ASGI server |
| pydantic >=2.7 | Data‑validation / serialization |
| SQLAlchemy >=2.0 | ORM for relational store |
| asyncpg >=0.29 | Async PostgreSQL / Timescale driver |
| psycopg2-binary >=2.9 | Sync PG driver (scripts) |
| alembic >=1.13 | DB migrations |
| pandas >=2.2 | Aggregations & CSV helpers |
| numpy >=1.26 | Financial maths |
| scipy >=1.12 | Optimisation routines |
| redis >=5.0 | Job & cache broker |
| celery >=5.3 | Background jobs (aggregator) |
| apscheduler >=3.10 | Lightweight sched alternative |
| python-dateutil >=2.9 | Date arithmetic |

> **TimescaleDB** extension must be enabled in PostgreSQL 15+.

### Frontend – Node (package.json)

| Package | Purpose |
|---------|---------|
| react 18.x | UI core |
| vite 5.x | Dev/build tool |
| recharts 2.x | Charting components |
| swr 2.x | Data fetching cache |
| date-fns 3.x | Date utilities |
| clsx 1.x | Conditional classNames |

Run `npm install` after pulling.

---

## Database & Migrations

1. **Provision DBs**
    ```bash
    docker compose up -d postgres redis timescale
    # or use your existing cluster – ensure TimescaleDB is installed
    ```
2. **Run initial migrations** (adds `LoanEvent`, `CashFlowTx`, `ReinvestmentMeta`, `TimeBucketMetric` tables)
    ```bash
    cd src/backend
    alembic upgrade head
    ```
3. **Seed / Recalculate legacy runs** *(optional, heavy)*
    ```bash
    python scripts/recompute_metrics.py --all
    ```

---
## Running the Module (v2)

We ship one orchestrator script at repo‑root:

```bash
./run_simulation_module.sh            # runs: alembic upgrade, backend, celery worker, frontend
./run_simulation_module.sh --backend-only
./run_simulation_module.sh --frontend-only
./run_simulation_module.sh --migrate-only
```

Internally this script:
1. Exports `.env` variables
2. Runs `alembic upgrade head`
3. Launches **FastAPI** with Uvicorn on `http://localhost:8000`
4. Starts a **Celery** worker + beat for aggregation jobs
5. Boots **Vite** dev‑server on `http://localhost:5173`

---

## New Environment Variables
| Key | Example | Notes |
|-----|---------|-------|
| DATABASE_URL | `postgresql+asyncpg://user:pass@localhost:5432/sim` | Timescale enabled |
| REDIS_URL | `redis://localhost:6379/0` | Celery broker / cache |
| CELERY_TIMEZONE | `UTC` | |
| AGG_BUCKETS | `DAILY,MONTHLY,QUARTERLY,YEARLY` | Which aggregations to compute |

Copy `.env.example` to `.env` and adjust.

---
## Aggregator Jobs

Aggregation happens either via Celery beat (every night) **or** manual:
```bash
python scripts/run_aggregator.py --sim-id <uuid> --bucket MONTHLY
```

The job writes to `time_bucket_metrics` and is exposed at:
`GET /api/sims/{id}/metrics?bucket=MONTHLY`.

---
## API Quick‑Start

```bash
curl http://localhost:8000/api/sims/<id>/reinvestments?include_events=true | jq
```
Response includes:
* `total_reinvestments`, `average_time_to_reinvestment_days` …
* `events` array with `source_loan_id`, `dest_loan_id` etc.

See `docs/api/PORTFOLIO_INSIGHTS_V2.md` for full schema.

---
## Frontend Dev Hints

```bash
cd src/frontend
npm run dev                 # vite dev‑server with HMR
npm run lint && npm test    # quality gates
```
The new hooks live under `src/frontend/src/hooks/useReinvestments.ts`.

---
## Upgrade / Migration Notes
* Legacy `/results` endpoint remains unchanged – clients can migrate at will.
* New endpoints are behind header `X-Api-Version: 2` until Q4‑24.
* Old yearly `cash_flows.reinvestment` field will be deprecated in Q1‑25.

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js (v16+)
- MongoDB
- Redis
- TimescaleDB (for time-series data)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/equihomepartners/simulation-module.git
   cd simulation-module
   ```

2. Set up the backend:
   ```
   cd src/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```
   cd src/frontend
   npm install
   ```

4. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Start the development servers:
   ```
   # Option 1: Using the simple startup script (recommended)
   ./start.sh

   # Option 2: Using the advanced startup script with connection utilities
   ./start_simulation_suite.sh

   # Option 3: Start servers individually
   # Backend
   cd src/backend
   python start_server.py
   # or
   python -m uvicorn main:app --reload --port 5005 --host 0.0.0.0

   # Frontend
   cd src/frontend
   node start_frontend.js
   # or
   npm run dev
   ```

   The startup scripts handle starting both servers with the correct configuration and ensure they can communicate with each other.

6. Access the application:
   ```
   http://localhost:5173
   ```

## Project Structure

```
simulation-module/
├── docs/                       # Documentation
│   ├── architecture/           # Architecture documentation
│   │   ├── server.py           # Main server entry point
│   │   ├── api/                # API routes and controllers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Data models
│   │   └── utils/              # Utility functions
│   └── frontend/               # Frontend code
│       ├── index.html          # Entry point
│       ├── css/                # Stylesheets
│       ├── js/                 # JavaScript files
│       └── assets/             # Static assets
└── tests/                      # Test suite
    ├── backend/                # Backend tests
    └── frontend/               # Frontend tests
```

## Development

### Running Tests

```
# Backend tests
cd tests/backend
python -m pytest

# Frontend tests
cd tests/frontend
npm test
```

### Building for Production

```
# Backend
cd src/backend
pip install -r requirements-prod.txt

# Frontend
cd src/frontend
npm run build
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this project.

## Starting the Application

We've created simple startup scripts to make it easy to run the application. These scripts handle starting both the frontend and backend servers with the correct configuration.

### Option 1: Simple Startup (Recommended)

The simplest way to start both servers:

```bash
./start.sh
```

This script:
- Starts the backend on port 5005
- Starts the frontend on port 5173
- Handles cleanup when you press Ctrl+C
- Has minimal configuration and is easy to understand

### Option 2: Advanced Startup with Connection Utilities

For more advanced features and configuration:

```bash
./start_simulation_suite.sh
```

This script:
- Has more advanced features like port checking
- Uses the shared connection configuration
- Has more error handling
- Offers more flexibility

### Starting Servers Individually

If you prefer to start the servers separately:

```bash
# Start the backend
cd src/backend
python start_server.py
# OR
python -m uvicorn main:app --reload --port 5005 --host 0.0.0.0

# Start the frontend
cd src/frontend
node start_frontend.js
# OR
npm run dev
```

The frontend script will automatically check if the backend is running and offer to start it if it's not.

## Robust Frontend-Backend Connection System

We've implemented a comprehensive connection system that ensures reliable communication between the frontend and backend, regardless of network configuration, ports, or IP versions.

### Shared Configuration System

Both frontend and backend use a shared configuration file (`src/connection.config.json`) that ensures consistent settings:

```json
{
  "backend": {
    "port": 5005,
    "host": "0.0.0.0",
    "protocol": "http"
  },
  "frontend": {
    "port": 5173,
    "host": "localhost",
    "protocol": "http"
  },
  "proxy": {
    "api_path": "/api",
    "ws_path": "/ws"
  }
}
```

### Smart Connection Detection

The frontend automatically detects the best way to connect to the backend:

1. **Primary Connection**: Uses IPv4 (127.0.0.1) by default
2. **Fallback Mechanisms**: Tries alternative connection methods if the primary fails
3. **Connection Status**: Provides real-time feedback about the connection status

### Connection Status UI

The Dashboard includes a ConnectionStatus component that shows:
- Current connection status (connected/disconnected)
- Connection method being used (IPv4/IPv6)
- Error details if connection fails
- Manual refresh option

### Backend Health Endpoints

The backend includes health check endpoints that allow the frontend to test the connection:

```
GET /api/health/ping - Simple ping endpoint
GET /api/health - Detailed server information
```

### Simulation Cancellation

To prevent performance issues, simulations are automatically canceled when users navigate away:

1. The frontend sends a cancellation request to the backend
2. The backend marks the simulation as "cancelled" but preserves the data
3. Resources are freed up while maintaining partial results

API endpoint for canceling a simulation:
```
POST /api/simulations/{simulation_id}/cancel
```

### Troubleshooting Connection Issues

If you experience connection issues:

1. Check the ConnectionStatus component in the Dashboard
2. Verify both servers are running (backend on port 5005, frontend on port 5173)
3. Try restarting both servers using the provided scripts
4. Check browser console for connection errors
5. Verify no firewall is blocking the connection

### Advanced Configuration

For advanced users who need to customize the connection:

1. Edit `src/connection.config.json` to change ports or hosts
2. Restart both servers for changes to take effect
3. The system will automatically adapt to the new configuration
