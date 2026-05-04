from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/cap-sheet", tags=["cap-sheet"])


@router.get("/", response_model=List[schemas.CapSheetEntryOut])
def get_cap_sheet(db: Session = Depends(get_db)):
    return (
        db.query(models.CapSheetEntry)
        .options(joinedload(models.CapSheetEntry.player))
        .order_by(models.CapSheetEntry.depth_chart_position, models.CapSheetEntry.string_number)
        .all()
    )


@router.post("/", response_model=schemas.CapSheetEntryOut, status_code=201)
def add_to_cap_sheet(entry: schemas.CapSheetEntryCreate, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == entry.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    existing = db.query(models.CapSheetEntry).filter(
        models.CapSheetEntry.player_id == entry.player_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Player already on cap sheet")

    db_entry = models.CapSheetEntry(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    return db.query(models.CapSheetEntry).options(
        joinedload(models.CapSheetEntry.player)
    ).filter(models.CapSheetEntry.id == db_entry.id).first()


@router.put("/{entry_id}", response_model=schemas.CapSheetEntryOut)
def update_cap_sheet_entry(
    entry_id: int, entry: schemas.CapSheetEntryUpdate, db: Session = Depends(get_db)
):
    db_entry = db.query(models.CapSheetEntry).filter(models.CapSheetEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for key, value in entry.model_dump(exclude_none=True).items():
        setattr(db_entry, key, value)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/", status_code=204)
def clear_cap_sheet(db: Session = Depends(get_db)):
    db.query(models.CapSheetEntry).delete()
    db.commit()


@router.delete("/{entry_id}", status_code=204)
def remove_from_cap_sheet(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(models.CapSheetEntry).filter(models.CapSheetEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_entry)
    db.commit()
