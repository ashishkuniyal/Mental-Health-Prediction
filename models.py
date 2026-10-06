from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    streak_count: int = 0
    last_checkin_date: Optional[date] = None

class PredictionRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    
    age: int
    gender: str
    country: str
    academic_level: str
    most_used_platform: str
    purpose_of_use: str
    avg_daily_usage_hours: float
    daily_unlocks: int
    study_hours: float
    physical_activity_hours: float
    sleep_hours_per_night: float
    stress_level: str
    
    score: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
