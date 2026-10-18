import pandas as pd
from pathlib import Path
from data_source import load_employees_and_skills

DATA_DIR = Path(__file__).parent / "data"

# Sample tasks are only used by the terminal menu (not by the web service)
try:
    tasks = pd.read_csv(DATA_DIR / "tasks.csv")
    task_skills = pd.read_csv(DATA_DIR / "task_skills.csv")
except FileNotFoundError:
    tasks = pd.DataFrame(columns=["task_id", "task_title"])
    task_skills = pd.DataFrame(columns=["task_id", "skill", "required_level"])

# Each task an employee is already working on removes this many score points
WORKLOAD_PENALTY = 10


def _load_state():
    """Fresh data on every request, so new skills/tasks show up immediately."""
    employees, employee_skills = load_employees_and_skills()
    lookup = {
        (r.employee_id, r.skill): r.level
        for r in employee_skills.itertuples(index=False)
    }
    return employees, lookup


def compute_recommendations_from_reqs(reqs: dict, top_n=5):
    """reqs = {"Node.js": 3, "SQL": 2}. Returns the top_n best candidates."""
    if not reqs:
        return []

    employees, skills_lookup = _load_state()
    results = []
    for emp in employees.itertuples(index=False):
        total, surplus, matched, missing = 0, 0, 0, []
        weakest = 1.0
        for skill, required in reqs.items():
            level = skills_lookup.get((emp.employee_id, skill), 0)
            ratio = min(level / required, 1)
            total += ratio
            weakest = min(weakest, ratio)
            if level >= required:
                matched += 1
                surplus += min(level - required, 2)
            else:
                missing.append(f"{skill} ({level}/{required})")

        # Blend average match with the weakest skill so that missing one
        # critical skill is not hidden by strong scores on the others.
        avg = total / len(reqs)
        skill_score = round((0.7 * avg + 0.3 * weakest) * 100, 2)
        final_score = round(
            max(0, skill_score - WORKLOAD_PENALTY * emp.current_tasks), 2
        )
        results.append({
            "employee_id": emp.employee_id,
            "name": emp.employee_name,
            "profile": emp.job_profile,
            "seniority": emp.seniority,
            "skill_score": skill_score,
            "current_tasks": int(emp.current_tasks),
            "score": final_score,  # skill match adjusted for workload
            "surplus": surplus,
            "matched_skills": matched,
            "total_skills": len(reqs),
            "missing": missing,
        })
    results.sort(key=lambda r: (r["score"], r["surplus"]), reverse=True)
    return results[:top_n]


def compute_recommendations(task_id, top_n=5):
    """Same as above, but for a task that exists in task_skills.csv."""
    reqs = task_skills[task_skills["task_id"] == task_id]
    reqs_dict = dict(zip(reqs["skill"], reqs["required_level"]))
    return compute_recommendations_from_reqs(reqs_dict, top_n)


def print_recommendations(task_id, results):
    title = tasks.loc[tasks["task_id"] == task_id, "task_title"].iloc[0]

    print("\n===================================")
    print("EMPLOYEE RECOMMENDATION")
    print("Task:", title)
    print("===================================\n")

    for rank, r in enumerate(results, start=1):
        print(f"Rank: {rank}")
        print("Employee:", r["name"])
        print("Profile:", r["profile"])
        print("Seniority:", r["seniority"])
        print(f"Skill match: {r['skill_score']}%")
        print("Current tasks:", r["current_tasks"])
        print(f"Final score: {r['score']}%")
        print(f"Skills satisfied: {r['matched_skills']}/{r['total_skills']}")
        print("Skills to improve:", ", ".join(r["missing"]) or "None")
        print("-----------------------------------")


if __name__ == "__main__":
    print("Recommendation system started!")
    print("\nAvailable tasks:")
    for task in tasks.itertuples(index=False):
        print(f"{task.task_id} - {task.task_title}")

    task_id = input("\nEnter task ID (example: T001): ").strip().upper()

    if task_id not in tasks["task_id"].values:
        print("Task not found!")
    else:
        results = compute_recommendations(task_id)
        if results:
            print_recommendations(task_id, results)
        else:
            print("No requirements found for this task.")