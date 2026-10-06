import joblib
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.database import Database
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr
from typing import Literal, List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import models
from database import get_db
import auth
import datetime

model = joblib.load('Mental_Health_Model.pkl')
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

app = FastAPI(
    title="MindMetric API",
    description="AI-powered mental health score prediction for students based on social media usage, lifestyle, and stress.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


#A first Pydantic Model
class StudentData(BaseModel):
    age                     : int = Field(..., ge=10, le=100)
    gender                  : Literal['Male', 'Female']
    country                 : str
    academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24)
    daily_unlocks           : int   = Field(..., ge=0)
    study_hours             : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night   : float = Field(..., ge=0, le=24)
    stress_level            : Literal['Medium', 'Low', 'Very High', 'High']




# Describe what we send back
class PredictionResponse(BaseModel):
    predicted_mental_health_score:float
    streak_count: int = 0




# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class HistoryResponse(BaseModel):
    id: int
    score: float
    created_at: str
    
    class Config:
        from_attributes = True

@app.post('/auth/register', tags=['Auth'])
def register(user: UserCreate, db: Database = Depends(get_db)):
    db_user = db.users.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user_data = {
        "email": user.email, 
        "hashed_password": hashed_pw, 
        "streak_count": 0, 
        "last_checkin_date": None, 
        "created_at": datetime.datetime.utcnow()
    }
    db.users.insert_one(new_user_data)
    return {"message": "User registered successfully"}

@app.post('/auth/login', response_model=Token, tags=['Auth'])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)):
    user = db.users.find_one({"email": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    token = auth.create_access_token(data={"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}


@app.get('/health', tags=['System'])
def health_check():
    """Check if the API and model are loaded and ready."""
    return {'status': 'ok', 'model': 'loaded', 'version': '2.0.0'}


from fastapi.security import OAuth2PasswordBearer
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

@app.post('/predict', response_model=PredictionResponse, tags=['Prediction'])
def predict(data: StudentData, db: Database = Depends(get_db), token: str = Depends(oauth2_scheme_optional)):
   
   user = auth.get_current_user_optional(token, db)
   
   country_group = data.country if data.country in top_countries else "Other"
   
   # Feature Engineering calculations
   stress_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4}
   stress_num = stress_map.get(data.stress_level, 2)
   
   sleep_screen_ratio = data.sleep_hours_per_night / (data.avg_daily_usage_hours + 1)
   productivity_ratio = data.study_hours / (data.avg_daily_usage_hours + 1)
   activity_stress_index = data.physical_activity_hours * stress_num

   input_row = pd.DataFrame([{
        'Age'                       :data.age,
        'Gender'                    :data.gender,
        'Country'                   :data.country,
        'Academic_Level'            :data.academic_level,
        'Most_Used_Platform'        :data.most_used_platform,
        'Purpose_Of_Use'            :data.purpose_of_use,
        'Avg_Daily_Usage_Hours'     :data.avg_daily_usage_hours,
        'Daily_Unlocks'             :data.daily_unlocks,
        'Study_Hours'               :data.study_hours,
        'Physical_Activity_Hours'   :data.physical_activity_hours,
        'Sleep_Hours_Per_Night'     :data.sleep_hours_per_night,
        'Stress_Level'              :data.stress_level,
        'Grouped_country'           :country_group,
        'Sleep_to_Screen_Ratio'     :sleep_screen_ratio,
        'Productivity_Ratio'        :productivity_ratio,
        'Activity_Stress_Index'     :activity_stress_index
   }])

   prediction = model.predict(input_row)[0] #6.77
   score = round(float(prediction), 2)
   
   streak = 0
   # Save to DB if logged in
   if user:
       record_data = data.model_dump()
       record_data["user_id"] = user.id
       record_data["score"] = score
       record_data["created_at"] = datetime.datetime.utcnow()
       db.predictions.insert_one(record_data)
       
       # Streak Gamification Logic
       today = datetime.date.today()
       today_dt = datetime.datetime.combine(today, datetime.datetime.min.time())
       
       if user.last_checkin_date != today:
           if user.last_checkin_date == today - datetime.timedelta(days=1):
               user.streak_count += 1
           else:
               user.streak_count = 1
           user.last_checkin_date = today
           db.users.update_one({"_id": ObjectId(user.id)}, {"$set": {"streak_count": user.streak_count, "last_checkin_date": today_dt}})
       
       streak = user.streak_count

   return PredictionResponse(predicted_mental_health_score=score, streak_count=streak)

@app.get('/user/profile', tags=['User'])
def get_profile(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "email": current_user.email,
        "streak_count": current_user.streak_count,
        "last_checkin": current_user.last_checkin_date
    }

@app.get('/history', tags=['Analytics'])
def get_history(db: Database = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    records = db.predictions.find({"user_id": current_user.id}).sort("created_at", -1).limit(10)
    return [{"id": str(r["_id"]), "score": r["score"], "created_at": r["created_at"].isoformat()} for r in records]

@app.get('/analytics', tags=['Analytics'])
def get_analytics(db: Database = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    records = list(db.predictions.find({"user_id": current_user.id}).sort("created_at", 1))
    return {
        "labels": [r["created_at"].strftime("%b %d") for r in records],
        "scores": [r["score"] for r in records]
    }

app.mount("/", StaticFiles(directory=".", html=True), name="static")