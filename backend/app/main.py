from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from importlib.metadata import version, PackageNotFoundError
import tomllib
from pathlib import Path

from app.db import init_db
from app.api import (
    members,
    clubs,
    memberships,
    match_templates,
    matches,
    participations,
    auth,
    notifications,
)


def get_app_version():
    try:
        # Try to get installed package version
        return version("backend")
    except PackageNotFoundError:
        # Fallback: Read pyproject.toml directly
        try:
            pyproject_path = Path(__file__).parent.parent / "pyproject.toml"
            with open(pyproject_path, "rb") as f:
                return tomllib.load(f)["project"]["version"]
        except Exception as e:
            print(f"Warning: Could not read version: {e}")
            return "0.1.0"  # Default fallback


app_version = get_app_version()


# This 'lifespan' function runs when the server starts
# It ensures your database tables are created automatically
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Server starting... Connecting to Database...")
    init_db()  # Creates tables defined in models.py (we will create models next)
    yield
    print("🛑 Server shutting down...")


# This is the 'app' object uvicorn is looking for!
app = FastAPI(title="Football Club API", version=app_version, lifespan=lifespan)

origins = [
    "http://localhost:3000",  # Local Frontend
    "https://football-club-frontend.vercel.app",  # Vercel Frontend (Replace with yours later)
    "*",  # Allow all (easiest for testing, secure later)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "message": "Hello! The Football Club API is running.",
        "version": app_version,
        "docs_url": "/docs",
    }


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(members.router, prefix="/members", tags=["members"])
app.include_router(clubs.router, prefix="/clubs", tags=["clubs"])
app.include_router(memberships.router, prefix="/memberships", tags=["memberships"])
app.include_router(match_templates.router, prefix="/match-templates", tags=["match-templates"])
app.include_router(matches.router, prefix="/matches", tags=["matches"])
app.include_router(participations.router, prefix="/participations", tags=["participations"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
