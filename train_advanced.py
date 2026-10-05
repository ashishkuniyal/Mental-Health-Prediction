import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# 1. Load Data
df = pd.read_csv('Student Social Media And Mental Health Impact.csv')

# 2. Feature Engineering
print("Engineering new features...")
top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']
df['Grouped_country'] = df['Country'].apply(lambda c: c if c in top_countries else 'Other')

# Advanced Metrics
df['Sleep_to_Screen_Ratio'] = df['Sleep_Hours_Per_Night'] / (df['Avg_Daily_Usage_Hours'] + 1)
df['Productivity_Ratio'] = df['Study_Hours'] / (df['Avg_Daily_Usage_Hours'] + 1)

# Map stress level to numerical for index
stress_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4}
df['Stress_Num'] = df['Stress_Level'].map(stress_map).fillna(2)
df['Activity_Stress_Index'] = df['Physical_Activity_Hours'] * df['Stress_Num']

# 3. Define X and y
target = 'Mental_Health_Score'
features = [
    'Age', 'Gender', 'Grouped_country', 'Academic_Level', 
    'Most_Used_Platform', 'Purpose_Of_Use', 'Avg_Daily_Usage_Hours', 
    'Daily_Unlocks', 'Study_Hours', 'Physical_Activity_Hours', 
    'Sleep_Hours_Per_Night', 'Stress_Level',
    'Sleep_to_Screen_Ratio', 'Productivity_Ratio', 'Activity_Stress_Index'
]

X = df[features]
y = df[target]

# 4. Preprocessing setup
num_cols = ['Age', 'Avg_Daily_Usage_Hours', 'Daily_Unlocks', 'Study_Hours', 
            'Physical_Activity_Hours', 'Sleep_Hours_Per_Night', 
            'Sleep_to_Screen_Ratio', 'Productivity_Ratio', 'Activity_Stress_Index']
cat_cols = ['Gender', 'Grouped_country', 'Academic_Level', 'Most_Used_Platform', 'Purpose_Of_Use', 'Stress_Level']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), num_cols),
        ('cat', OneHotEncoder(handle_unknown='ignore'), cat_cols)
    ]
)

# 5. Model Pipeline
pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('model', RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42))
])

# 6. Train/Test Split & Train
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Advanced Model...")
pipeline.fit(X_train, y_train)

# 7. Evaluate
y_pred = pipeline.predict(X_test)
print(f"Testing R2 Score: {r2_score(y_test, y_pred):.3f}")
print(f"Testing MAE: {mean_absolute_error(y_test, y_pred):.3f}")

# 8. Save
joblib.dump(pipeline, 'Mental_Health_Model.pkl')
print("Saved newly trained model to Mental_Health_Model.pkl")
