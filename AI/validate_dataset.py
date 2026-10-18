import pandas as pd
from pathlib import Path

DATA = Path(__file__).parent / "data"
emp = pd.read_csv(DATA / "employees.csv")
es = pd.read_csv(DATA / "employee_skills.csv")
tasks = pd.read_csv(DATA / "tasks.csv")
ts = pd.read_csv(DATA / "task_skills.csv")

print("=== Basic checks ===")
print("Levels in 1-5 (employees):", es["level"].between(1, 5).all())
print("Levels in 1-5 (tasks):", ts["required_level"].between(1, 5).all())
print("Duplicate employee/skill rows:",
      es.duplicated(["employee_id", "skill"]).sum())
print("Unknown employee IDs:",
      (~es["employee_id"].isin(emp["employee_id"])).sum())
print("Task skills missing from employee skills:",
      set(ts["skill"]) - set(es["skill"]))

print("\n=== Skills per employee ===")
print(es.groupby("employee_id").size().describe().round(2))

print("\n=== Level distribution ===")
print(es["level"].value_counts().sort_index())

print("\n=== Average level by seniority ===")
print(es.merge(emp, on="employee_id")
        .groupby("seniority")["level"].mean().round(2))

print("\n=== Qualified candidates per task ===")
lookup = es.set_index(["employee_id", "skill"])["level"].to_dict()
rows = []
for _, t in tasks.iterrows():
    reqs = ts[ts["task_id"] == t["task_id"]]
    full = near = 0
    for eid in emp["employee_id"]:
        ok = [lookup.get((eid, r.skill), 0) >= r.required_level
              for r in reqs.itertuples()]
        if all(ok):
            full += 1
        elif sum(ok) >= len(ok) - 1:
            near += 1
    rows.append({"task": t["task_title"], "fully_qualified": full,
                 "missing_one_skill": near})

report = pd.DataFrame(rows)
print(report.to_string(index=False))
print("\nTasks with 0 qualified:", (report["fully_qualified"] == 0).sum())