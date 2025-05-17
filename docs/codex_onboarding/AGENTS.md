# AI Agent Onboarding: Equihome Fund Simulation Engine

## 1. Business Context
- **Purpose of the Simulation Engine:** A sophisticated financial modeling system designed to simulate, analyze, and optimize real estate investment fund strategies. The primary focus is on funds investing in 10-year loan products for single-family properties, typically structured with no monthly payments from borrowers, relying on property appreciation and eventual sale/refinance.
- **Business Model:** The simulation engine supports Equihome's core business in real estate fund management. It enables:
    - Structuring and testing new fund concepts.
    - Performing due diligence and risk assessment on potential investment strategies.
    - Optimizing portfolio allocations to meet specific investor return and risk profiles.
    - Generating reports and analytics for internal decision-making and investor communication.
    - Providing a robust platform for what-if analysis and stress testing under various market conditions.
- **Target Users:** Internal fund managers, financial analysts, risk management teams, and potentially external institutional investors or partners requiring detailed insight into fund mechanics and projections.
- **Key Problems Solved:**
    - Complexity in modeling long-term real estate investments with unique loan structures.
    - Need for sophisticated risk analysis (Monte Carlo, stress testing).
    - Requirement for optimizing fund structures and portfolio composition.
    - Demand for transparent and detailed financial projections and reporting.

    **1.1. User Personas & Key Workflows**
    -   ***Fund Structuring Analyst:***
        -   Utilizes the Simulation Configuration Wizard extensively to model new fund proposals.
        -   Experiments with various fee structures (management fees, carried interest, hurdle rates), deployment schedules, leverage options, and capital call strategies.
        -   Analyzes the impact of these parameters on key LP and GP metrics (e.g., Net IRR, TVPI, DPI, GP Carry).
        -   Iterates on fund models to achieve target return profiles and optimize splits.
    -   ***Portfolio Manager / Risk Analyst:***
        -   Runs Monte Carlo simulations on established or proposed fund models to assess downside risk and the probability distribution of returns.
        -   Conducts stress tests by defining custom scenarios (e.g., interest rate spikes, housing market downturns) or using predefined stress tests.
        -   Analyzes `results.monte_carlo_results` and `results.stress_test_results` to understand risk exposures and potential impacts.
        -   May use optimization features to explore adjustments to portfolio allocation based on risk/return objectives.
    -   ***Investor Relations / Reporting Team:***
        -   Extracts key performance indicators, cash flow projections, and visualizations from simulation results.
        -   Uses data from the LP Economics Dashboard and other results views for investor reports and presentations.
        -   Relies on the accuracy and clarity of exported data (e.g., CSV, PDF) for external communications.

    **1.2. Strategic Importance & Goals (for Equihome):**
    -   **Competitive Differentiation:** Provides Equihome with a sophisticated, proprietary modeling capability, setting it apart from competitors relying on simpler or off-the-shelf tools.
    -   **Enhanced Decision-Making:** Enables more informed investment decisions through rigorous quantitative analysis and scenario modeling.
    -   **Product Innovation:** Serves as a sandbox for developing and testing innovative fund structures and investment products.
    -   **Risk Management:** Central to understanding and mitigating risks associated with fund investments and portfolio strategies.
    -   **Investor Confidence:** Demonstrates a commitment to transparency and sophisticated financial engineering, potentially increasing investor trust.
    -   **Operational Efficiency:** Aims to automate and streamline parts of the fund analysis and reporting workflow.

## 2. Project Overview
- **High-Level Architecture:** Backend (Python/FastAPI), Frontend (React/Vite), SDK (auto-generated from OpenAPI), Database (PostgreSQL/TimescaleDB for core data, Redis for caching/Celery).
- **Main Goals:**
    - Provide an accurate and flexible simulation environment for real estate funds.
    - Enable advanced analytics including Monte Carlo simulations and portfolio optimization.
    - Offer an intuitive user interface for configuring simulations and interpreting results.
    - Integrate with Equihome's broader platform ecosystem (Traffic Light System, Portfolio Management, Underwriting).
- **Key Features:**
    - **Comprehensive Fund Modeling:** Detailed configuration of fund parameters, including size, term, vintage, deployment schedules, and complex fee structures (management fees, carried interest, hurdles). See `docs/frontend/PARAMETER_TRACKING.md` for an exhaustive list.
    - **Simulation Configuration Wizard:** An interactive frontend wizard (`src/pages/wizard.tsx`) guides users through setting up all necessary parameters for a simulation run.
    - **Portfolio Generation:** Simulation of loan portfolios based on defined characteristics (LTV, loan size, geographic zone allocations, etc.).
    - **Cash Flow Engine:** Detailed calculation of periodic cash flows at the loan, fund, LP, and GP levels.
    - **Waterfall Calculations:** Sophisticated distribution logic (American/European waterfalls) to allocate profits between LPs and GP.
    - **Monte Carlo Simulations:** Robust risk analysis capabilities by running thousands of scenarios with probabilistic inputs for key variables (e.g., appreciation rates, default rates). Results include distributions, convergence analysis, and factor attribution (see `results.monte_carlo_results` in backend output).
    - **Efficient Frontier Optimization:** Portfolio optimization tools to identify optimal asset allocations.
    - **Stress Testing:** Scenario generation and impact analysis tools, providing heat-map data for various stress factors (see `results.stress_test_results` in backend output).
    - **LP Economics Dashboard:** Dedicated frontend tab for visualizing LP-specific metrics, cash flows, NAV, DPI, etc. (`src/frontend/src/components/results/lp-economics/LPEconomicsTab.tsx`).
    - **Institutional-Grade UI:** Modern, responsive interface built with Shadcn/UI and Recharts.
    - **Comprehensive Reporting:** Exportable results and visualizations.
- **Core Financial Concepts Documented in `docs/frontend/PARAMETER_TRACKING.md`:**
    - **Waterfall Structures:** European vs. American, hurdle rates, catch-up mechanisms, carried interest splits.
    - **Management Fees:** Various bases (committed capital, invested capital, NAV), step-down provisions.
    - **LP/GP Economics:** Detailed breakdown of commitments, contributions, distributions, and returns for both LPs and the GP.
    - **Leverage:** Multiple tranches of debt (Green Sleeve, A+ Overadvance, Deal Notes, Ramp Line).
    - **Market Conditions:** Yearly trends for housing, interest rates, economic outlook.
    - **Deployment & Reinvestment:** Pacing, granularity (monthly/yearly), reinvestment rules.
    - **Fees & Expenses:** Origination fees, fund expenses, formation costs.
    - **Performance Metrics:** IRR, TVPI, DPI, RVPI, PIC, Sharpe Ratio, etc.
    - **Monte Carlo Variables:** Specification for probabilistic draws on many deterministic parameters.

    **2.1. High-Level Data Flow:**
    1.  **Configuration (Frontend):** User defines all simulation parameters via the multi-step "Simulation Configuration Wizard" (`src/pages/wizard.tsx`). This involves inputting data for fund structure, fees, deployment, market assumptions, etc., as detailed in `docs/frontend/PARAMETER_TRACKING.md`.
    2.  **API Request (Frontend to Backend):** On submission, the frontend (using the auto-generated SDK from `src/frontend/src/api/`) sends the complete configuration object to the backend, typically to an endpoint like `/api/simulations` (POST).
    3.  **Simulation Execution (Backend):**
        *   The backend (`simulation_api.py`) receives the configuration.
        *   It may persist this configuration and create a simulation record in the PostgreSQL database.
        *   The core simulation logic is invoked (orchestrated by `services/simulation_service.py` and executed by modules in `calculations/`). This involves:
            *   Portfolio generation (`portfolio_generation.py`).
            *   Loan lifecycle modeling (`loan_lifecycle.py`).
            *   Cash flow calculation (`cashflow.py`).
            *   Waterfall distributions (`waterfall.py`).
            *   Performance metric calculation (`performance.py`).
            *   If enabled, Monte Carlo simulations (`monte_carlo.py`) or stress tests (`stress_testing.py`).
    4.  **Results Storage & Retrieval (Backend):**
        *   Detailed periodic results (cash flows, NAVs, etc.) and summary metrics are typically stored in the PostgreSQL/TimescaleDB database, associated with the simulation ID.
        *   Aggregated metrics might be computed via Celery background tasks and stored.
    5.  **API Response (Backend to Frontend):** The backend can return results synchronously (for smaller simulations) or provide a simulation ID for asynchronous polling. Results are fetched via endpoints like `/api/simulations/{simulation_id}/results`.
    6.  **Visualization & Analysis (Frontend):** The frontend receives the results data (e.g., JSON payloads). Components like `NavDpiQuadChartC.tsx`, KPI ribbons, and data tables process this data to render charts, display metrics, and allow user interaction (e.g., toggling views, exploring data points).

## 3. Key Project Documentation
- **`docs/codex_onboarding/AGENTS.md` (This file):** Central onboarding document for AI agents.
- **`docs/frontend/PARAMETER_TRACKING.md`:** **CRITICAL DOCUMENT.** Provides an exhaustive list of all simulation parameters, their types, descriptions, default values, corresponding UI components, and important notes on backend logic (e.g., the `deployment_monthly_granularity` flag and related backend fix). This is the primary reference for understanding the configurable aspects of the simulation.
- **`docs/Auditapr24/simulation_config_schema.md`:** The canonical JSON schema for all simulation parameters, enforcing backend validation. Referenced by `PARAMETER_TRACKING.md`.
- **`README.md` (Root of project):** General project overview, manual setup instructions for backend/frontend, orchestration script usage, and high-level architecture.
- **`docs/frontend/ADVANCED_VISUALIZATION_GUIDE.md`:** Guide for understanding and implementing advanced visualizations in the frontend.
- **Backend OpenAPI Schema:** Available at `/openapi.json` from the running backend (e.g., `http://localhost:8000/openapi.json`). Source of truth for API endpoints and SDK generation.

## 4. Backend Details
- **Technology Stack:** Python (3.9+), FastAPI, Uvicorn, SQLAlchemy (with Alembic for migrations), Pandas, Numpy, Pydantic.
- **Setup & Running:**
    - **Recommended Orchestration:** `./run_simulation_module.sh`. This script handles:
        - Exporting `.env` variables.
        - Running Alembic database migrations (`alembic upgrade head`).
        - Launching the FastAPI backend server (default: `http://localhost:8000`).
        - Starting Celery worker and beat for background tasks.
    - Manual Backend Setup (if not using orchestrator):
        - `cd src/backend`
        - `python -m venv venv`
        - `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
        - `pip install -r requirements.txt`
        - `python -m uvicorn main:app --reload --port 8000` (Port 8000 is the project default as per README, though 5005 has been used in dev).
- **Database:**
    - PostgreSQL (15+) with TimescaleDB extension enabled for time-series data.
    - Redis: Used as Celery message broker and for caching.
    - Provisioning: `docker compose up -d postgres redis timescale` (as per `README.md`).
    - Migrations: `cd src/backend && alembic upgrade head`.
- **Key Modules & Logic:**
    - `main.py`: FastAPI application initialization, middleware, top-level routers.
    - `api/`: Contains API endpoint definitions.
        - `simulation_api.py`: Endpoints for creating simulations, fetching configurations, and retrieving results.
        - `config_api.py`: Endpoints for managing simulation configuration presets.
    - `calculations/`: Core financial and simulation logic.
        - `performance.py`: Calculates IRR, multiples (TVPI, DPI, RVPI), and other performance metrics.
        - `cashflow.py`: Generates periodic cash flows for fund, LPs, and GP.
        - `waterfall.py`: Implements distribution logic.
        - `monte_carlo.py`: Engine for Monte Carlo simulations.
        - `risk_decomposition.py`: OLS attribution of IRR.
        - `stress_testing.py`: Scenario generation and heat-map data.
        - `portfolio_generation.py`: Creates simulated loan portfolios.
        - `loan_lifecycle.py`: Models individual loan evolution.
    - `models/`: Pydantic models for request/response validation and data serialization.
    - `database/`: SQLAlchemy models for database tables and interaction logic.
    - `services/`: Business logic layer orchestrating calculations and database interactions.
- **Background Jobs:**
    - Celery worker + beat for asynchronous tasks, particularly data aggregation.
    - Aggregator script: `python scripts/run_aggregator.py --sim-id <uuid> --bucket <BUCKET_NAME>`
    - Aggregated data stored in `time_bucket_metrics` table, exposed via `GET /api/sims/{id}/metrics?bucket=<BUCKET_NAME>`.
- **Simulation Parameters & Configuration:**
    - The backend processes a complex simulation configuration object. The structure and available parameters are exhaustively detailed in `docs/frontend/PARAMETER_TRACKING.md` and validated against `docs/Auditapr24/simulation_config_schema.md`.
    - **Crucial Parameter:** `deployment_monthly_granularity` (boolean). As noted in `PARAMETER_TRACKING.md`, this controls whether the entire simulation uses monthly or yearly time steps. A backend fix is documented there to ensure this parameter correctly overrides the default time granularity settings.

## 5. Frontend Details
- **Technology Stack:** React (18.x), Vite (5.x), TypeScript, Shadcn/UI (component library based on Tailwind CSS), Recharts (2.x for charts), Zustand (state management), SWR (2.x for data fetching), Zod (schema validation for forms), `date-fns` (3.x), `clsx` (1.x).
- **Setup & Running:**
    - **Recommended Orchestration:** `./run_simulation_module.sh` (also starts the Vite dev server).
    - Frontend server default: `http://localhost:5173` (Vite HMR).
    - Manual Frontend Setup:
        - `cd src/frontend`
        - `npm install`
        - `npm run dev`
- **Project Structure (Illustrative):**
    - `src/api/`: Auto-generated SDK client and core API request configuration.
    - `src/components/`:
        - `ui/`: Generic UI components, often wrappers around Shadcn/UI elements.
        - `results/`: Components for displaying simulation results (e.g., `lp-economics/NavDpiQuadChartC.tsx`, `kpi-ribbons`, etc.).
        - `wizard/`: Components for each step of the simulation configuration wizard.
        - `common/`: Shared components like `HeaderBarA`.
    - `src/pages/`: Top-level page components (e.g., `wizard.tsx`, `results.tsx`).
    - `src/hooks/`: Custom React hooks (e.g., for data fetching, complex UI logic).
    - `src/lib/`: Utility functions (e.g., `formatters.ts`, `utils.ts`).
    - `src/store/`: Zustand stores for global/shared state.
    - `src/schemas/`: Zod schemas for form validation within the wizard and other input forms.
    - `src/types/`: TypeScript interfaces and type definitions.
- **Simulation Configuration Wizard:**
    - Located at `src/pages/wizard.tsx`, with step components under `src/components/wizard/steps/`.
    - Provides a user-friendly interface to configure all simulation parameters.
    - The parameters and their corresponding UI controls (sliders, dropdowns, etc.) are extensively documented in `docs/frontend/PARAMETER_TRACKING.md`. Many example React components for these inputs are also included in that document.
- **Key Components to be Aware Of:**
    - `LPEconomicsTab.tsx` (`src/frontend/src/components/results/lp-economics/LPEconomicsTab.tsx`): Main layout for the LP Economics dashboard.
    - `NavDpiQuadChartC.tsx` (`src/frontend/src/components/results/lp-economics/NavDpiQuadChartC.tsx`): Complex Recharts component for NAV/DPI visualization.
    - Various parameter input components (sliders, dropdowns, custom editors) as exemplified in `PARAMETER_TRACKING.md`.
- **State Management:** Zustand for managing global and feature-specific state.
- **Styling:** Tailwind CSS, primarily applied through Shadcn/UI components. Custom styles in global CSS files or component-specific CSS modules if necessary.

## 6. SDK (Software Development Kit)
- **Generation:**
    - Auto-generated from the backend's OpenAPI schema (available at `http://localhost:8000/openapi.json` when the backend is running).
    - The generation script is `generate-sdk.sh` (located in the project root), which uses `openapi-typescript-codegen`.
- **Usage:**
    - Located in `src/frontend/src/api/`.
    - Provides strongly-typed TypeScript functions to interact with all backend API endpoints.
    - Simplifies data fetching and ensures type safety between frontend and backend.
    - Used extensively by frontend components (especially within the wizard and results pages) to send simulation configurations and retrieve results.
    - Example service usage: `SimulationsService.createSimulationApiSimulationsPost(...)`.

## 7. API Documentation
- **Source of Truth:** The OpenAPI schema, accessible at `/openapi.json` from the running backend (e.g., `http://localhost:8000/openapi.json`). This schema is used to generate the SDK.
- **Interactive API Docs:** FastAPI typically provides interactive documentation via Swagger UI at `/docs` and ReDoc at `/redoc` on the backend URL (e.g., `http://localhost:8000/docs`).
- **Key Endpoints (Illustrative - refer to OpenAPI schema for actuals):**
    - `/api/simulations`: POST to create new simulations, GET to list simulations.
    - `/api/simulations/{simulation_id}`: GET simulation details and configuration.
    - `/api/simulations/{simulation_id}/results`: GET comprehensive simulation results (cash flows, performance metrics, etc.). This endpoint may accept query parameters like `time_granularity`.
    - `/api/simulations/{simulation_id}/config`: GET/PUT simulation configuration.
    - `/api/simulations/{simulation_id}/portfolio-evolution`: GET data related to portfolio changes over time.
    - `/api/simulations/{simulation_id}/visualization`: GET data structured for specific visualizations.
    - `/api/sims/{id}/metrics?bucket=<BUCKET_NAME>`: GET aggregated time-bucketed metrics.
    - `/api/configs`: CRUD operations for simulation configuration presets.
- **API Versioning:** Potentially uses `X-Api-Version` header for v2 endpoints (confirm current practice).
- **Authentication:** Currently, no explicit authentication mechanism is apparent in the provided logs or documentation. Assume public access for local development unless specified otherwise.

## 8. Development Environment & Workflow
- **Orchestration Script (`./run_simulation_module.sh`):** The preferred way to start the full development environment.
    - Sources environment variables from `.env`.
    - Ensures database migrations are applied.
    - Starts backend (FastAPI), frontend (Vite), and Celery services.
- **Environment Variables (`.env` file):**
    - Copy from `.env.example` and customize.
    - `DATABASE_URL`: e.g., `postgresql+asyncpg://user:pass@localhost:5432/sim_db_timescale`
    - `REDIS_URL`: e.g., `redis://localhost:6379/0`
    - `CELERY_TIMEZONE`: e.g., `UTC`
    - `AGG_BUCKETS`: Comma-separated list, e.g., `DAILY,MONTHLY,QUARTERLY,YEARLY`
    - Other backend/frontend specific variables.
- **Backend Dependencies:** Managed in `src/backend/requirements.txt`. (Check for `pyproject.toml` if Poetry is used).
- **Frontend Dependencies:** Managed in `src/frontend/package.json` (using npm).
- **Linting:**
    - Frontend: `cd src/frontend && npm run lint` (likely ESLint, Prettier).
    - Backend: (To be confirmed - typically Flake8, Black, MyPy).
- **Testing:**
    - Frontend: `cd src/frontend && npm test` (likely Jest/React Testing Library).
    - Backend: (To be confirmed - typically Pytest).
- **Database Provisioning & Migrations:**
    - Docker: `docker compose up -d postgres redis timescale` for local DB and Redis instances.
    - Migrations: `cd src/backend && alembic upgrade head` to apply schema changes.

## 9. Git Repository (`equihomepartners/core-simulation-engine`)
- **Main Remote URL:** `https://github.com/equihomepartners/core-simulation-engine.git`
- **Key Directories:**
    - `docs/`: Project documentation, including this file and `PARAMETER_TRACKING.md`.
    - `src/backend/`: All Python backend code.
    - `src/frontend/`: All TypeScript/React frontend code.
    - `scripts/`: Utility and operational scripts (e.g., `generate-sdk.sh`, `run_aggregator.py`).
- **Branching Strategy (Assumed typical):**
    - `main` (or `master`): Production-ready or most stable code.
    - Feature branches (e.g., `feat/new-wizard-step`, `fix/chart-rendering-bug`): Develop new features or fixes in isolation.
    - Pull Requests: Used to merge feature branches into `main` after review.
- **Commits:** Adhere to conventional commit messages if possible (e.g., `feat: ...`, `fix: ...`, `docs: ...`).

## 10. Key Past Decisions & Current State
- **SDK Generation:** Shifted to `openapi-typescript-codegen` for better type safety and maintainability.
- **UI Components:** Standardizing on Shadcn/UI for a consistent look and feel, with custom components built as needed.
- **LP Economics Tab:** Major focus of recent development, involving creation of `HeaderBarA`, `KPIRibbonB`, and the complex `NavDpiQuadChartC`. UI refinements for this chart (event markers, data table layout) are ongoing.
- **Backend Data Robustness:** Improvements made to handle varied numerical input formats (e.g., `.isdigit()` issue in `simulation_api.py`).
- **Frontend Data Handling:** `prepareChartData` in `NavDpiQuadChartC.tsx` enhanced to be more resilient to missing or differently structured keys in backend cash flow data.
- **Parameter Granularity:** The `deployment_monthly_granularity` parameter and its correct handling throughout the backend is a key consideration, as noted in `PARAMETER_TRACKING.md`.
- **Full Stack Orchestration:** Use of `./run_simulation_module.sh` simplifies local development setup.

    **10.1. Current Development Focus & Short-Term Goals**
    -   **Stabilization & Bug Fixing:** Continued focus on ensuring the stability and accuracy of core calculations, especially in the LP Economics tab and related cash flow/waterfall logic.
    -   **UI Polish & UX Enhancements:** Improving the user experience of the LP Economics dashboard (e.g., `NavDpiQuadChartC` event markers, data table layout) and the Simulation Wizard.
    -   **Monte Carlo & Advanced Analytics Integration:** Ensuring seamless data flow and robust visualization for Monte Carlo simulation results (`results.monte_carlo_results`) and stress testing outputs (`results.stress_test_results`).
    -   **Performance Optimization:** Identifying and addressing any performance bottlenecks in both backend simulation runtimes and frontend data rendering, especially for large datasets or complex simulations.
    -   **Documentation Expansion:** Continuously updating `AGENTS.md`, `PARAMETER_TRACKING.md`, and other key documents as the system evolves.
    -   **Test Coverage:** Increasing unit and integration test coverage across both backend and frontend.

## 11. Common Gotchas, Design Principles & Best Practices
-   **`deployment_monthly_granularity` Parameter:** As highlighted in `PARAMETER_TRACKING.md` and section 4, this boolean is **critical**. It dictates whether the entire simulation engine (deployment, cash flows, reinvestment, exits, etc.) operates on a monthly or yearly timestep. Ensure all new backend logic correctly respects this flag and does not hardcode or wrongly default to a specific granularity. The documented backend fix for `simulation_controller.py` (or equivalent logic) must be maintained.
-   **Data Consistency (Backend to Frontend):** The structure of data returned by backend API (especially `/results` and `/portfolio-evolution` endpoints) is crucial for the frontend. Any changes to backend response schemas must be coordinated with frontend updates and SDK regeneration. Refer to `prepareChartData` in `NavDpiQuadChartC.tsx` for an example of frontend resilience but also its dependence on certain key fields.
-   **Immutability (Frontend):** When working with state in React/Zustand, always treat state as immutable. Create new objects/arrays when updating state rather than mutating existing ones.
-   **Type Safety (Frontend & Backend):** Leverage TypeScript (frontend) and Pydantic (backend) for strong typing. Ensure SDK is regenerated (`generate-sdk.sh`) after any backend API contract changes.
-   **Shadcn/UI & Tailwind CSS (Frontend):** Favor using Shadcn/UI components and Tailwind utility classes for styling. Avoid custom CSS where possible to maintain consistency.
-   **Performance (Frontend):** Be mindful of re-renders in React. Use `React.memo`, `useCallback`, `useMemo` where appropriate, especially for complex components or large lists. Profile components if performance issues are suspected.
-   **Performance (Backend):** For computationally intensive tasks in Python, leverage vectorized operations with Pandas/Numpy where possible. For database queries, ensure efficient indexing and avoid N+1 query patterns.
-   **Clear Parameter Definitions:** All simulation parameters should have clear definitions, types, and default values documented in `PARAMETER_TRACKING.md`. Backend validation should align with this schema.
-   **Modular Design (Backend):** The `calculations/` directory is intended for modular, reusable calculation logic. Strive to keep these modules focused and testable in isolation.
-   **Error Handling:** Implement comprehensive error handling. Backend should return meaningful HTTP status codes and error messages. Frontend should gracefully handle API errors and provide user feedback.
-   **Logging:** Add informative logging in the backend (DEBUG, INFO, ERROR levels) to aid in debugging and monitoring.
-   **Configuration Management:** Backend configurations are complex. Ensure changes are backward compatible or versioned appropriately if breaking changes are unavoidable.

## 12. Agent Instructions (Prompt for AI Agent)

### Role:
You are an expert AI pair programmer and software engineer. Your primary goal is to assist in the development and enhancement of the Equihome Fund Simulation Engine. You will collaborate with a human developer.

### Instructions:
- **Thoroughly review this document (`AGENTS.md`) and `docs/frontend/PARAMETER_TRACKING.md` before providing solutions.** These are your primary sources of truth for project context, parameters, and architecture.
- When asked to write or modify code, strictly adhere to the existing coding styles, patterns, and technologies used in the respective backend (Python/FastAPI/SQLAlchemy/Pandas) or frontend (TypeScript/React/Zustand/Shadcn/UI/Recharts) parts of the project.
- Ensure any new frontend components are responsive, accessible (a11y), and follow established UX best practices.
- Ensure backend code is efficient, scalable, well-documented, and includes robust error handling and logging.
- If you need to make assumptions to proceed, state them clearly. If an assumption is significant, ask for clarification.
- If a user request is ambiguous or lacks necessary detail, ask for clarification before proceeding.
- When proposing file modifications, always specify the full target file path from the project root.
- For new files, suggest an appropriate path and filename consistent with project conventions.
- When discussing solutions, reference specific functions, components, parameters (using their names from `PARAMETER_TRACKING.md`), or files from the context provided.
- Proactively help identify potential bugs, areas for improvement, or inconsistencies with documented behavior.
- Assist with writing and updating documentation (including this `AGENTS.md` file and `PARAMETER_TRACKING.md` if parameters change) and tests (Pytest for backend, Jest/RTL for frontend).
- Pay close attention to the simulation parameters listed in `PARAMETER_TRACKING.md`; they are central to the engine's functionality.
- For UI tasks, ensure solutions align with the Shadcn/UI framework and Tailwind CSS utility classes.

### Key Files & Entry Points to Be Familiar With:
- **This Document:** `docs/codex_onboarding/AGENTS.md`
- **Parameter Bible:** `docs/frontend/PARAMETER_TRACKING.md`
- **Backend Core:**
    - `src/backend/main.py` (FastAPI app)
    - `src/backend/api/simulation_api.py` (Simulation endpoints)
    - `src/backend/calculations/` (Directory with all core logic: `performance.py`, `cashflow.py`, `waterfall.py`, `monte_carlo.py`)
    - `src/backend/models/` (Pydantic models)
    - `src/backend/services/simulation_service.py` (Orchestration layer)
- **Frontend Core:**
    - `src/frontend/src/App.tsx` (Main application component)
    - `src/frontend/src/pages/wizard.tsx` (Simulation configuration wizard)
    - `src/frontend/src/pages/results.tsx` (Simulation results display)
    - `src/frontend/src/components/results/lp-economics/LPEconomicsTab.tsx` (LP Economics main view)
    - `src/frontend/src/components/results/lp-economics/NavDpiQuadChartC.tsx` (Key results chart)
    - `src/frontend/src/store/` (Zustand stores)
    - `src/frontend/src/api/` (Generated SDK)
- **SDK Generation:** `generate-sdk.sh` (root script), uses `openapi.json` from backend.
- **Orchestration:** `./run_simulation_module.sh` (root script).

---
**(This document is a living document and should be updated by AI and human developers as the project evolves)** 