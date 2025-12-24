from sqlmodel import create_engine, SQLModel, Session
import os
from dotenv import load_dotenv

load_dotenv() # Load env vars from .env

# Handle the case where the URL starts with "postgres://" (SQLAlchemy needs "postgresql://")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    """Creates tables if they don't exist"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for FastAPI Routes"""
    with Session(engine) as session:
        yield session
