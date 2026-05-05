from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    school = Column(String(100), nullable=False)
    position = Column(String(10), nullable=False)
    year = Column(String(10), nullable=False)
    height = Column(String(10))
    weight = Column(Integer)
    player_type = Column(String(20), nullable=False)
    actual_salary = Column(Numeric(12, 2))
    projected_salary = Column(Numeric(12, 2))
    coach_rating = Column(Integer)
    notes = Column(Text)
    flight_risk = Column(Integer)
    performance_vs_contract = Column(String(30))
    projected_ask_vs_expected_value = Column(String(30))
    recruiting_status = Column(String(20))
    last_contact_date = Column(String(20))
    photo_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    cap_sheet_entry = relationship(
        "CapSheetEntry", back_populates="player", uselist=False, cascade="all, delete-orphan"
    )


class CapSheetEntry(Base):
    __tablename__ = "cap_sheet_entries"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), unique=True, nullable=False)
    depth_chart_position = Column(String(20), nullable=False)
    string_number = Column(Integer, nullable=False, default=1)
    tier = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="cap_sheet_entry")


class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    logo_path = Column(String(255))


class SavedRoster(Base):
    __tablename__ = "saved_rosters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    entries = relationship(
        "SavedRosterEntry", back_populates="roster", cascade="all, delete-orphan"
    )


class SavedRosterEntry(Base):
    __tablename__ = "saved_roster_entries"

    id = Column(Integer, primary_key=True, index=True)
    roster_id = Column(Integer, ForeignKey("saved_rosters.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    depth_chart_position = Column(String(20), nullable=False)
    string_number = Column(Integer, nullable=False, default=1)

    roster = relationship("SavedRoster", back_populates="entries")
    player = relationship("Player")
