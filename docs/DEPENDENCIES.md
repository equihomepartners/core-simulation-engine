# Installing Required Dependencies

This document provides instructions for installing all dependencies required by the Equihome Fund Simulation Engine.

## Backend Dependencies

The backend server requires the following Python packages:

```bash
# Core dependencies
pip install fastapi uvicorn pydantic python-multipart

# Data processing
pip install numpy pandas scipy

# Scientific computing
pip install cvxpy

# Utilities
pip install python-dotenv
```

### CVXPY Installation

CVXPY is used for portfolio optimization. It can sometimes be challenging to install due to its dependencies. Here are OS-specific instructions:

#### macOS

```bash
# Install dependencies with Homebrew
brew install cmake llvm

# Set environment variables for LLVM
export LLVM_CONFIG=/usr/local/opt/llvm/bin/llvm-config

# Install CVXPY
pip install cvxpy
```

#### Ubuntu/Debian

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential cmake python3-dev

# Install CVXPY
pip install cvxpy
```

#### Windows

```bash
# Install Visual C++ Build Tools
# Download from https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Install CVXPY
pip install cvxpy
```

## Frontend Dependencies

The frontend requires Node.js and npm:

```bash
# Install dependencies
npm install

# Install specific packages needed for tests
npm install axios node-fetch util
```

## Verifying Installation

To verify that all dependencies are installed correctly, run:

```bash
# Start the backend server
python src/backend/server.py

# In another terminal, run the API transformation test
node src/frontend/tests/transform-test.js mock
```

If both commands run without errors, the dependencies are installed correctly.

## Troubleshooting

### Missing CVXPY

If you see warnings like:

```
cvxpy not installed. Portfolio optimization functionality will be limited.
```

But you've installed cvxpy, try:

```bash
# Verify installation
python -c "import cvxpy; print(cvxpy.__version__)"

# If that fails, try reinstalling with specific solver support
pip uninstall -y cvxpy
pip install cvxpy
```

### Other Issues

For other dependency issues, please check the official documentation for each package:

- [FastAPI](https://fastapi.tiangolo.com/)
- [CVXPY](https://www.cvxpy.org/install/index.html)
- [NumPy](https://numpy.org/install/)
- [Pandas](https://pandas.pydata.org/pandas-docs/stable/getting_started/install.html) 