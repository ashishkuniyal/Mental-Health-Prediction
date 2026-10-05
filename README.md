# MindMetric — Full-Stack Mental Wellness Analytics

MindMetric is a full-stack, machine-learning-powered web application that analyzes a student's digital habits, academic workload, and lifestyle to predict their mental health score.

With a premium editorial design, personalized dashboard, and advanced gamification, MindMetric is built to encourage daily wellness check-ins.

## 🚀 Features

- **Advanced Machine Learning:** Uses a hyper-tuned `RandomForestRegressor` pipeline. Includes custom feature engineering (Sleep-to-Screen Ratio, Productivity Ratio, Activity-Stress Index) for highly accurate predictions.
- **Secure User Accounts:** Full authentication system using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Relational Database:** Stores user profiles and historical prediction records securely using SQLite and SQLAlchemy.
- **Gamified Streaks:** Automatically tracks and visually rewards daily check-in streaks to encourage consistent wellness monitoring.
- **Personalized Dashboard:** Logs logged-in users' historical scores and plots them on a dynamic, beautiful line graph using Chart.js.
- **Premium Editorial UI:** Built with HTML, CSS, and Vanilla JavaScript. Features a dark "Deep Mocha" theme, vibrant Amber/Teal accents, and a clean 3-step wizard flow.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js.
- **Backend:** Python 3, [FastAPI](https://fastapi.tiangolo.com/), Uvicorn.
- **Database & Auth:** SQLite, SQLAlchemy ORM, PyJWT, Bcrypt.
- **Machine Learning:** Scikit-learn, Pandas, Joblib.

## ⚙️ Getting Started

### Prerequisites

Ensure you have Python 3.8+ installed on your local machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ashishkuniyal/Mental-Health-Prediction.git
   cd Mental-Health-Prediction
   ```

2. **Install the required dependencies:**
   ```bash
   pip install -r requirements.txt
   # Or on Windows: py -m pip install -r requirements.txt
   ```

3. **Run the Application:**
   Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   # Or on Windows: py -m uvicorn main:app --reload
   ```
   *Note: The SQLite database (`mindmetric.db`) will automatically generate itself upon the first run.*

4. **Access the App:**
   Open your browser and navigate to [http://127.0.0.1:8000](http://127.0.0.1:8000). 

## 📡 API Endpoints

- **`POST /auth/register`**: Register a new user account.
- **`POST /auth/login`**: Authenticate and receive a JWT Bearer token.
- **`POST /predict`**: Accepts student profile data and returns a predicted score. If a Bearer token is provided, saves the score to the DB and updates the user's streak.
- **`GET /history`**: Returns a list of past predictions for the authenticated user.
- **`GET /analytics`**: Returns chronologically ordered scores for charting.
- **`GET /user/profile`**: Returns the user's email, streak count, and last check-in date.

## 📝 License

This project is licensed under the MIT License.

---
*Built for informational purposes only. This is an educational machine learning project and not a clinical assessment.*
