"""Loads employees + skills from PostgreSQL (if DATABASE_URL is set) or CSV files.

Set in your terminal before starting the service, for example (PowerShell):
  $env:DATABASE_URL="postgresql+psycopg2://USER:PASSWORD@localhost:5432/YOUR_DB"
Needs:  pip install sqlalchemy psycopg2-binary
"""
import os
from functools import lru_cache
from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).parent / "data"

# Reads DATABASE_URL from a ".env" file next to this script, if python-dotenv
# is installed (pip install python-dotenv). A real terminal variable still wins.
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Queries written from your Sequelize models (users, employees, tasks).
# Checked against your models: users, employees, tasks, skills, employee_skills.
# Open workload = tasks assigned to the employee that are pending or in_progress.
# The AS names must stay exactly as written.
# ---------------------------------------------------------------------------
EMPLOYEES_SQL = """
SELECT e.id::text                    AS employee_id,
       u.full_name                   AS employee_name,
       COALESCE(e.job_title, 'N/A')  AS job_profile,
       'mid'                         AS seniority,
       COUNT(t.id) FILTER (
           WHERE t.status::text IN ('pending', 'in_progress')
       )                             AS current_tasks
FROM employees e
JOIN users u ON u.id = e.user_id
LEFT JOIN tasks t ON t.assigned_employee_id = e.id
WHERE u.status = 'active'
GROUP BY e.id, u.full_name, e.job_title
"""

SKILLS_SQL = """
SELECT es.employee_id::text AS employee_id,
       s.name               AS skill,
       es.level             AS level
FROM employee_skills es
JOIN skills s ON s.id = es.skill_id
"""


SKILL_NAMES_SQL = "SELECT name FROM skills ORDER BY name"

# Used only in demo mode (CSV files, no database)
DEFAULT_SKILLS = [
    "JavaScript", "Node.js", "Express.js", "React", "HTML", "CSS", "Python",
    "Machine Learning", "SQL", "PostgreSQL", "Git", "Docker", "REST API",
    "Data Analysis", "Testing",
]


@lru_cache(maxsize=1)
def _engine():
    from sqlalchemy import create_engine
    return create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)


def load_employees_and_skills():
    if os.environ.get("DATABASE_URL"):
        employees = pd.read_sql(EMPLOYEES_SQL, _engine())
        skills = pd.read_sql(SKILLS_SQL, _engine())
    else:  # demo mode with the synthetic CSV files
        employees = pd.read_csv(DATA_DIR / "employees.csv")
        skills = pd.read_csv(DATA_DIR / "employee_skills.csv")
        employees["employee_id"] = employees["employee_id"].astype(str)
        skills["employee_id"] = skills["employee_id"].astype(str)

    if "current_tasks" not in employees.columns:
        employees["current_tasks"] = 0
    employees["current_tasks"] = employees["current_tasks"].fillna(0).astype(int)
    return employees, skills


def load_skill_names():
    """The skills the agent may use = the rows of your `skills` table."""
    if os.environ.get("DATABASE_URL"):
        df = pd.read_sql(SKILL_NAMES_SQL, _engine())
        return df["name"].tolist()
    return list(DEFAULT_SKILLS)