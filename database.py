import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load local .env file if it exists
load_dotenv()

# Define the MongoDB URL using environment variables for security
MONGO_DATABASE_URL = os.getenv("MONGO_DATABASE_URL")

if not MONGO_DATABASE_URL:
    raise ValueError("MONGO_DATABASE_URL environment variable is not set!")

client = MongoClient(MONGO_DATABASE_URL)
db_client = client["mindmetric_db"]

# Dependency for FastAPI
def get_db():
    return db_client
