from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware # <--- 1. Import this

from app.db import init_db
from app import models
from app.api import members, clubs, memberships

# This 'lifespan' function runs when the server starts
# It ensures your database tables are created automatically
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Server starting... Connecting to Database...")
    init_db()  # Creates tables defined in models.py (we will create models next)
    yield
    print("🛑 Server shutting down..." )

# This is the 'app' object uvicorn is looking for!
app = FastAPI(
    title="Football Club API",
    version="0.1.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",                  # Local Frontend
    "https://football-club-frontend.vercel.app", # Vercel Frontend (Replace with yours later)
    "*"                                       # Allow all (easiest for testing, secure later)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

app.include_router(members.router, prefix="/members", tags=["members"])
app.include_router(clubs.router, prefix="/clubs", tags=["clubs"])
app.include_router(memberships.router, prefix="/memberships", tags=["memberships"])

@app.get("/")
def read_root():
    return {"message": "Hello! The Football Club API is running."}
