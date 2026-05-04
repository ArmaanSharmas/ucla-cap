from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/saved-rosters", tags=["saved-rosters"])


@router.get("/", response_model=List[schemas.SavedRosterOut])
def list_saved_rosters(db: Session = Depends(get_db)):
    rosters = db.query(models.SavedRoster).order_by(models.SavedRoster.created_at.desc()).all()
    return [
        schemas.SavedRosterOut(
            id=r.id,
            name=r.name,
            created_at=r.created_at,
            entry_count=len(r.entries),
        )
        for r in rosters
    ]


@router.get("/{roster_id}", response_model=schemas.SavedRosterDetailOut)
def get_saved_roster(roster_id: int, db: Session = Depends(get_db)):
    roster = (
        db.query(models.SavedRoster)
        .options(
            joinedload(models.SavedRoster.entries).joinedload(models.SavedRosterEntry.player)
        )
        .filter(models.SavedRoster.id == roster_id)
        .first()
    )
    if not roster:
        raise HTTPException(status_code=404, detail="Roster not found")
    return roster


@router.post("/", response_model=schemas.SavedRosterOut, status_code=201)
def create_saved_roster(data: schemas.SavedRosterCreate, db: Session = Depends(get_db)):
    current_entries = db.query(models.CapSheetEntry).all()
    roster = models.SavedRoster(name=data.name)
    db.add(roster)
    db.flush()
    for entry in current_entries:
        db.add(models.SavedRosterEntry(
            roster_id=roster.id,
            player_id=entry.player_id,
            depth_chart_position=entry.depth_chart_position,
            string_number=entry.string_number,
        ))
    db.commit()
    db.refresh(roster)
    return schemas.SavedRosterOut(
        id=roster.id,
        name=roster.name,
        created_at=roster.created_at,
        entry_count=len(roster.entries),
    )


@router.put("/{roster_id}", response_model=schemas.SavedRosterOut)
def rename_saved_roster(roster_id: int, data: schemas.SavedRosterRename, db: Session = Depends(get_db)):
    roster = db.query(models.SavedRoster).filter(models.SavedRoster.id == roster_id).first()
    if not roster:
        raise HTTPException(status_code=404, detail="Roster not found")
    roster.name = data.name
    db.commit()
    db.refresh(roster)
    return schemas.SavedRosterOut(
        id=roster.id,
        name=roster.name,
        created_at=roster.created_at,
        entry_count=len(roster.entries),
    )


@router.delete("/{roster_id}", status_code=204)
def delete_saved_roster(roster_id: int, db: Session = Depends(get_db)):
    roster = db.query(models.SavedRoster).filter(models.SavedRoster.id == roster_id).first()
    if not roster:
        raise HTTPException(status_code=404, detail="Roster not found")
    db.delete(roster)
    db.commit()


@router.post("/{roster_id}/load", status_code=200)
def load_saved_roster(roster_id: int, db: Session = Depends(get_db)):
    roster = (
        db.query(models.SavedRoster)
        .options(joinedload(models.SavedRoster.entries))
        .filter(models.SavedRoster.id == roster_id)
        .first()
    )
    if not roster:
        raise HTTPException(status_code=404, detail="Roster not found")
    db.query(models.CapSheetEntry).delete()
    skipped = []
    for entry in roster.entries:
        player = db.query(models.Player).filter(models.Player.id == entry.player_id).first()
        if player:
            db.add(models.CapSheetEntry(
                player_id=entry.player_id,
                depth_chart_position=entry.depth_chart_position,
                string_number=entry.string_number,
            ))
        else:
            skipped.append(entry.player_id)
    db.commit()
    return {"ok": True, "skipped_count": len(skipped)}
