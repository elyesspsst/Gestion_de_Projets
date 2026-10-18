"""Run ONCE: adds a simulated 'current_tasks' column to data/employees.csv."""
import random
import pandas as pd
from pathlib import Path

path = Path(__file__).parent / "data" / "employees.csv"
df = pd.read_csv(path)

if "current_tasks" in df.columns:
    print("current_tasks already exists, nothing to do.")
else:
    rng = random.Random(7)  # reproducible
    df["current_tasks"] = [
        rng.choices([0, 1, 2, 3, 4], weights=[30, 30, 20, 15, 5])[0]
        for _ in range(len(df))
    ]
    df.to_csv(path, index=False)
    print("Added current_tasks to", len(df), "employees.")
    print(df["current_tasks"].value_counts().sort_index())