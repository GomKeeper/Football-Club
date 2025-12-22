from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db import init_db
from app import models

# This 'lifespan' function runs when the server starts
# It ensures your database tables are created automatically
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Server starting... Connecting to Database...")
    init_db()  # Creates tables defined in models.py (we will create models next)
    yield
    print("🛑 Server shutting down...")

# This is the 'app' object uvicorn is looking for!
app = FastAPI(
    title="Football Club API",
    version="0.1.0",
    lifespan=lifespan
)

@app.get("/")
def read_root():
    return {"message": "Hello! The Football Club API is running."}
