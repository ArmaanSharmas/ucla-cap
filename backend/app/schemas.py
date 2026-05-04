from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class PlayerBase(BaseModel):
    name: str
    school: str
    position: str
    year: str
    height: Optional[str] = None
    weight: Optional[int] = None
    player_type: str
    actual_salary: Optional[Decimal] = None
    projected_salary: Optional[Decimal] = None
    coach_rating: Optional[int] = None
    notes: Optional[str] = None
    flight_risk: Optional[int] = None
    performance_vs_contract: Optional[str] = None
    projected_ask_vs_expected_value: Optional[str] = None
    recruiting_status: Optional[str] = None
    last_contact_date: Optional[str] = None
    photo_path: Optional[str] = None


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(PlayerBase):
    pass


class PlayerOut(PlayerBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CapSheetEntryBase(BaseModel):
    player_id: int
    depth_chart_position: str
    string_number: int = 1


class CapSheetEntryCreate(CapSheetEntryBase):
    pass


class CapSheetEntryUpdate(BaseModel):
    depth_chart_position: Optional[str] = None
    string_number: Optional[int] = None


class CapSheetEntryOut(CapSheetEntryBase):
    id: int
    player: PlayerOut
    created_at: datetime

    model_config = {"from_attributes": True}


class SavedRosterCreate(BaseModel):
    name: str


class SavedRosterRename(BaseModel):
    name: str


class SavedRosterOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    entry_count: int = 0

    model_config = {"from_attributes": True}


class SavedRosterEntryOut(BaseModel):
    id: int
    player_id: int
    depth_chart_position: str
    string_number: int
    player: PlayerOut

    model_config = {"from_attributes": True}


class SavedRosterDetailOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    entries: List[SavedRosterEntryOut] = []

    model_config = {"from_attributes": True}
