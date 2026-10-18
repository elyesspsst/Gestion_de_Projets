
import pandas as pd
import random
from pathlib import Path

# Reproducible dataset
random.seed(42)

# Output directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 1. Available technical skills
SKILLS = [
    "JavaScript",
    "Node.js",
    "Express.js",
    "React",
    "HTML",
    "CSS",
    "Python",
    "Machine Learning",
    "SQL",
    "PostgreSQL",
    "Git",
    "Docker",
    "REST API",
    "Data Analysis",
    "Testing"
]

# 2. Employee profiles and their main skills
PROFILES = {
    "Backend Developer": [
        "JavaScript", "Node.js", "Express.js",
        "PostgreSQL", "SQL", "REST API", "Testing", "Git"
    ],
    "Frontend Developer": [
        "JavaScript", "React", "HTML", "CSS",
        "Git", "Testing", "REST API"
    ],
    "Data Analyst": [
        "Python", "SQL", "PostgreSQL",
        "Data Analysis", "Git"
    ],
    "ML Engineer": [
        "Python", "Machine Learning", "Data Analysis",
        "SQL", "Git", "Testing"
    ],
    "Full Stack Developer": [
        "JavaScript", "Node.js", "Express.js",
        "React", "HTML", "CSS", "PostgreSQL",
        "REST API", "Git", "Testing"
    ],
    "DevOps Engineer": [
        "Docker", "Git", "Python", "Testing",
        "SQL", "Node.js"
    ]
}


# 3. Generate 100 synthetic employees
SENIORITY = {"junior": -1, "mid": 0, "senior": 1}
SENIORITY_WEIGHTS = [0.3, 0.45, 0.25]

def clamp_level(x):
    return max(1, min(5, round(x)))

employees = []
employee_skills = []

for i in range(1, 101):
    employee_id = f"E{i:03d}"

    profile = random.choice(list(PROFILES.keys()))
    main_skills = PROFILES[profile]

    seniority = random.choices(
        list(SENIORITY.keys()), weights=SENIORITY_WEIGHTS
    )[0]
    shift = SENIORITY[seniority]

    # Core skills from the profile
    number_of_skills = random.randint(4, 8)
    selected_skills = random.sample(
        main_skills, min(number_of_skills, len(main_skills))
    )

    # Extra skills truly OUTSIDE the profile
    outside_skills = [s for s in SKILLS if s not in main_skills]
    extra_count = min(random.randint(0, 2), len(outside_skills))
    extra_skills = random.sample(outside_skills, extra_count)

    employees.append({
        "employee_id": employee_id,
        "employee_name": f"Employee_{i:03d}",
        "job_profile": profile,
        "seniority": seniority
    })

    for skill in selected_skills:
        level = clamp_level(random.gauss(3.3 + shift, 0.8))
        employee_skills.append(
            {"employee_id": employee_id, "skill": skill, "level": level}
        )

    for skill in extra_skills:
        level = clamp_level(random.gauss(2 + 0.5 * shift, 0.8))
        employee_skills.append(
            {"employee_id": employee_id, "skill": skill, "level": level}
        )


        
# 4. Define 20 tasks and their required skills
TASK_TEMPLATES = [
    ("Create REST API", {"Node.js": 3, "Express.js": 3, "REST API": 4}),
    ("Build React Dashboard", {"React": 4, "JavaScript": 3, "CSS": 2}),
    ("Implement Login System", {"Node.js": 3, "SQL": 3, "Testing": 2}),
    ("Analyze Project Data", {"Python": 3, "Data Analysis": 4, "SQL": 3}),
    ("Build ML Prototype", {"Python": 4, "Machine Learning": 4, "Data Analysis": 3}),
    ("Create Responsive UI", {"HTML": 3, "CSS": 4, "JavaScript": 3}),
    ("Optimize Database Queries", {"SQL": 4, "PostgreSQL": 4}),
    ("Test Backend Endpoints", {"Testing": 4, "REST API": 3, "Node.js": 2}),
    ("Prepare Deployment", {"Docker": 4, "Git": 3}),
    ("Create Employee API", {"Node.js": 4, "Express.js": 4, "PostgreSQL": 3}),
    ("Build Task Management Page", {"React": 3, "JavaScript": 4, "HTML": 2}),
    ("Visualize Statistics", {"Python": 3, "Data Analysis": 3}),
    ("Implement Authentication", {"Node.js": 4, "SQL": 3, "Testing": 3}),
    ("Develop UI Components", {"React": 3, "CSS": 3, "JavaScript": 3}),
    ("Automate Tests", {"Testing": 4, "JavaScript": 3, "Git": 2}),
    ("Prepare ML Dataset", {"Python": 3, "Data Analysis": 3, "SQL": 2}),
    ("Improve Database Performance", {"PostgreSQL": 4, "SQL": 4}),
    ("Integrate Frontend and Backend", {"REST API": 4, "React": 3, "Node.js": 3}),
    ("Evaluate ML Model", {"Python": 4, "Machine Learning": 4}),
    ("Manage Development Workflow", {"Git": 3, "Testing": 2})
]

tasks = []
task_skills = []

for i, (title, requirements) in enumerate(TASK_TEMPLATES, start=1):
    task_id = f"T{i:03d}"
    tasks.append({
        "task_id": task_id,
        "task_title": title
    })

    for skill, required_level in requirements.items():
        task_skills.append({
            "task_id": task_id,
            "skill": skill,
            "required_level": required_level
        })


# 5. Save all datasets as CSV files
df_employees = pd.DataFrame(employees)
df_employee_skills = pd.DataFrame(employee_skills)
df_tasks = pd.DataFrame(tasks)
df_task_skills = pd.DataFrame(task_skills)

df_employees.to_csv(DATA_DIR / "employees.csv", index=False)
df_employee_skills.to_csv(DATA_DIR / "employee_skills.csv", index=False)
df_tasks.to_csv(DATA_DIR / "tasks.csv", index=False)
df_task_skills.to_csv(DATA_DIR / "task_skills.csv", index=False)

print("Dataset generated successfully!")
print(f"Employees: {len(df_employees)}")
print(f"Employee skills: {len(df_employee_skills)}")
print(f"Tasks: {len(df_tasks)}")
print(f"Task requirements: {len(df_task_skills)}")
print(f"CSV files saved in: {DATA_DIR}")
