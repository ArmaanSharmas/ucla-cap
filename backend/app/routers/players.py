import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "players")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/", response_model=List[schemas.PlayerOut])
def get_players(
    db: Session = Depends(get_db),
    position: Optional[str] = Query(None),
    player_type: Optional[str] = Query(None),
    school: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    query = db.query(models.Player)
    if position:
        query = query.filter(models.Player.position == position)
    if player_type:
        query = query.filter(models.Player.player_type == player_type)
    if school:
        query = query.filter(models.Player.school.ilike(f"%{school}%"))
    if search:
        query = query.filter(models.Player.name.ilike(f"%{search}%"))
    return query.order_by(models.Player.name).all()


@router.get("/{player_id}", response_model=schemas.PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/", response_model=schemas.PlayerOut, status_code=201)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    db_player = models.Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.put("/{player_id}", response_model=schemas.PlayerOut)
def update_player(player_id: int, player: schemas.PlayerUpdate, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    for key, value in player.model_dump().items():
        setattr(db_player, key, value)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(db_player)
    db.commit()


@router.post("/{player_id}/photo", response_model=schemas.PlayerOut)
async def upload_player_photo(
    player_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Delete old photo file from disk before saving new one
    if db_player.photo_path:
        old_filename = db_player.photo_path.split("/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{player_id}_{uuid.uuid4().hex[:8]}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(await file.read())

    db_player.photo_path = f"/uploads/players/{filename}"
    db.commit()
    db.refresh(db_player)
    return db_player
