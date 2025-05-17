#!/usr/bin/env python3
"""Validate a Traffic-Light System dataset against the canonical JSON-Schema.

Usage
-----
$ python scripts/validate_tls_dataset.py path/to/dataset.json  # explicit file
$ TRAFFIC_LIGHT_DATA_FILE=path/to/dataset.json python scripts/validate_tls_dataset.py  # env var

If no argument and no env var is provided the script falls back to the default
mock dataset so CI can always run this without config.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import List

try:
    import jsonschema as _jsonschema
except ImportError as e:  # pragma: no cover – import guard for missing dep
    raise SystemExit("jsonschema not installed. Add `jsonschema` to requirements.txt") from e


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = PROJECT_ROOT / "src/backend/data/tls_models/zone_schema.json"
DEFAULT_DATA_PATH = PROJECT_ROOT / "src/backend/data/sydney_tls_mock.json"
ENV_VAR = "TRAFFIC_LIGHT_DATA_FILE"


def _load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _validate(dataset: List[dict], schema: dict) -> None:
    """Validate list of zone dicts. Raises jsonschema.ValidationError on failure."""
    validator = _jsonschema.Draft7Validator(schema)
    errors = sorted(validator.iter_errors(dataset), key=lambda e: e.path)
    if errors:
        out_lines = [
            f"❌ Validation failed with {len(errors)} error(s):",
        ]
        for err in errors[:20]:  # cap output
            loc = " → ".join(map(str, err.path))
            out_lines.append(f"• {loc}: {err.message}")
        raise SystemExit("\n".join(out_lines))


def main() -> None:  # noqa: D401
    # 1. Determine dataset path
    if len(sys.argv) > 1:
        data_path = Path(sys.argv[1]).expanduser().resolve()
    else:
        env_val = os.getenv(ENV_VAR)
        data_path = Path(env_val).expanduser().resolve() if env_val else DEFAULT_DATA_PATH

    if not data_path.is_file():
        raise SystemExit(f"Dataset file not found: {data_path}")

    # 2. Load files
    dataset = _load_json(data_path)
    schema = _load_json(SCHEMA_PATH)

    # 3. Validate
    _validate(dataset, schema)

    print(f"✅ Dataset '{data_path.name}' passed validation against zone_schema.json (records: {len(dataset)})")


if __name__ == "__main__":
    main() 