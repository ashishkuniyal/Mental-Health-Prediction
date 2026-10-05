from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Gamification
    streak_count = Column(Integer, default=0)
    last_checkin_date = Column(Date, nullable=True)

    predictions = relationship("PredictionRecord", back_populates="user")


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Inputs
    age = Column(Integer)
    gender = Column(String)
    country = Column(String)
    academic_level = Column(String)
    most_used_platform = Column(String)
    purpose_of_use = Column(String)
    avg_daily_usage_hours = Column(Float)
    daily_unlocks = Column(Integer)
    study_hours = Column(Float)
    physical_activity_hours = Column(Float)
    sleep_hours_per_night = Column(Float)
    stress_level = Column(String)
    
    # Output
    score = Column(Float)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="predictions")
