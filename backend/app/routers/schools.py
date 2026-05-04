import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from urllib.parse import unquote
from pydantic import BaseModel
from .. import models
from ..database import get_db

router = APIRouter(prefix="/schools", tags=["schools"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "schools")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}


class SchoolOut(BaseModel):
    name: str
    logo_path: str | None = None

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[SchoolOut])
def get_schools(db: Session = Depends(get_db)):
    school_names = (
        db.query(models.Player.school)
        .distinct()
        .order_by(models.Player.school)
        .all()
    )
    names = [r[0] for r in school_names]

    school_map = {}
    rows = db.query(models.School).all()
    for row in rows:
        school_map[row.name] = row.logo_path

    return [{"name": n, "logo_path": school_map.get(n)} for n in names]


@router.post("/{school_name}/logo", response_model=SchoolOut)
async def upload_school_logo(
    school_name: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    name = unquote(school_name)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"{name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(await file.read())

    logo_path = f"/uploads/schools/{filename}"
    school = db.query(models.School).filter(models.School.name == name).first()
    if school:
        school.logo_path = logo_path
    else:
        school = models.School(name=name, logo_path=logo_path)
        db.add(school)
    db.commit()
    return {"name": name, "logo_path": logo_path}


@router.delete("/{school_name}/logo", status_code=204)
def delete_school_logo(school_name: str, db: Session = Depends(get_db)):
    name = unquote(school_name)
    school = db.query(models.School).filter(models.School.name == name).first()
    if school:
        school.logo_path = None
        db.commit()
