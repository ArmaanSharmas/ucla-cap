import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from .database import engine
from . import models
from .routers import players, cap_sheet, saved_rosters, schools

models.Base.metadata.create_all(bind=engine)

# Dev migrations — add columns if they don't exist
with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE players
        ADD COLUMN IF NOT EXISTS flight_risk INTEGER,
        ADD COLUMN IF NOT EXISTS performance_vs_contract VARCHAR(30),
        ADD COLUMN IF NOT EXISTS projected_ask_vs_expected_value VARCHAR(30),
        ADD COLUMN IF NOT EXISTS recruiting_status VARCHAR(20),
        ADD COLUMN IF NOT EXISTS last_contact_date VARCHAR(20),
        ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255)
    """))
    conn.execute(text("""
        ALTER TABLE cap_sheet_entries
        ADD COLUMN IF NOT EXISTS tier VARCHAR(20)
    """))
    conn.commit()

app = FastAPI(title="UCLA CAP API", version="3.0.0")

_default_origins = "http://localhost:5173,http://localhost:3000"
_allowed = os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "players"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "schools"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(players.router)
app.include_router(cap_sheet.router)
app.include_router(saved_rosters.router)
app.include_router(schools.router)


@app.get("/health")
def health():
    return {"status": "ok"}
