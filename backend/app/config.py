#Environment settings shared by the API and services.

import os
from pathlib import Path

from dotenv import load_dotenv

# Resolve relative to this file, not the shell's working directory.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def allowed_origins() -> list[str]:
    #Return explicitly allowed frontend URLs for browser requests.
    raw = os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]
