import json
import re
import ollama
from data_source import load_skill_names
from recommend_employees import compute_recommendations_from_reqs

MODEL = "qwen2.5:3b"  # free, runs locally through Ollama

# Short words a project manager might type -> candidate skill names.
# The first candidate that really exists in your `skills` table is used.
ALIASES = {
    "api": ["REST API"], "apis": ["REST API"], "endpoint": ["REST API"],
    "endpoints": ["REST API"], "rest": ["REST API"],
    "postgres": ["PostgreSQL"], "node": ["Node.js"], "nodejs": ["Node.js"],
    "js": ["JavaScript"], "reactjs": ["React"], "ml": ["Machine Learning"],
    "test": ["Testing"], "tests": ["Testing"], "unit tests": ["Testing"],
    "express": ["Express.js"],
    "css": ["CSS", "HTML/CSS"], "html": ["HTML", "HTML/CSS"],
    "stylesheet": ["CSS", "HTML/CSS"], "stylesheets": ["CSS", "HTML/CSS"],
    "ui": ["UI/UX Design"], "ux": ["UI/UX Design"], "ui/ux": ["UI/UX Design"],
    "wireframe": ["UI/UX Design"], "wireframes": ["UI/UX Design"],
    "mockup": ["UI/UX Design"], "mockups": ["UI/UX Design"],
    "figma": ["UI/UX Design"],
    "sequelize": ["Sequelize"], "orm": ["Sequelize"],
    "business analyst": ["Business Analysis"],
    "user stories": ["Business Analysis"],
}


def get_skills():
    return load_skill_names()


def ask(prompt: str, as_json: bool = False) -> str:
    kwargs = {"format": "json"} if as_json else {}
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        **kwargs,
    )
    return response["message"]["content"]


def default_level(text: str) -> int:
    t = text.lower()
    if any(w in t for w in ["senior", "expert", "advanced", "complex"]):
        return 4
    if any(w in t for w in ["junior", "basic", "simple", "beginner"]):
        return 2
    return 3  # mid-level


def mentioned_in_text(word: str, text: str) -> bool:
    pattern = r"(?<![\w.])" + re.escape(word.lower()) + r"(?![\w])"
    return re.search(pattern, text.lower()) is not None


def resolve_skill(name: str, by_lower: dict):
    """Map a name (from the model or an alias) to a real skill, or None."""
    key = str(name).strip().lower()
    if key in by_lower:
        return by_lower[key]
    for candidate in ALIASES.get(key, []):
        if candidate.lower() in by_lower:
            return by_lower[candidate.lower()]
    return None


def extract_requirements(task_text: str, skills=None) -> dict:
    return extract_requirements_with_status(task_text, skills)[0]


def extract_requirements_with_status(task_text: str, skills=None):
    """Returns (requirements, llm_ok). llm_ok is False when Ollama failed
    and only the keyword safety net was used."""
    skills = skills if skills is not None else get_skills()
    by_lower = {s.lower(): s for s in skills}

    prompt = f"""Convert this task description into required skills.
Use ONLY these skills: {skills}
Levels are integers from 1 to 5. Use level 3 unless the task says
junior/simple (2) or senior/expert/complex (4).
Include every skill the task mentions, and ONLY those.
Do not guess or add skills that are not in the task text.
Return ONLY a JSON object. If no listed skill is mentioned, return {{}}.
The format is {{"<skill name>": <level>}}.

Task: {task_text}"""
    llm_ok = True
    try:
        raw = json.loads(ask(prompt, as_json=True))
        if not isinstance(raw, dict):
            raw, llm_ok = {}, False
    except Exception as exc:
        print("LLM extraction failed, using keyword fallback:", exc)
        raw, llm_ok = {}, False

    # 1. Validate the LLM output: never trust it blindly
    reqs = {}
    for skill, level in raw.items():
        name = resolve_skill(skill, by_lower)
        try:
            level = int(level)
        except (TypeError, ValueError):
            continue
        if name and 1 <= level <= 5:
            reqs[name] = level

    # 2. Safety net: add any skill the text names explicitly
    for skill in skills:
        if skill not in reqs and mentioned_in_text(skill, task_text):
            reqs[skill] = default_level(task_text)
    for alias in ALIASES:
        if mentioned_in_text(alias, task_text):
            name = resolve_skill(alias, by_lower)
            if name and name not in reqs:
                reqs[name] = default_level(task_text)
    return reqs, llm_ok


def explain(reqs: dict, results: list) -> str:
    """Built from real data only, so it can never invent facts."""
    lines = []
    for i, r in enumerate(results, 1):
        missing_names = {m.split(" (")[0] for m in r["missing"]}
        ok = [s for s in reqs if s not in missing_names]
        lines.append(
            f"{i}. {r['name']} - {r['profile']}, {r['seniority']} "
            f"(final score {r['score']}%)"
        )
        lines.append(
            f"   Skill match: {r['skill_score']}% | "
            f"Current tasks: {r['current_tasks']}"
        )
        lines.append("   Strengths: " + (", ".join(ok) if ok else "none"))
        lines.append("   Gaps: " + (", ".join(r["missing"]) if r["missing"]
                                    else "none, meets every requirement"))
        lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    skills = get_skills()
    by_lower = {s.lower(): s for s in skills}
    print("Skills known to the agent:", ", ".join(skills))
    print("Type 'quit' at the task prompt to exit.\n")
    while True:
        text = input("Describe the task: ").strip()
        if text.lower() in ("quit", "exit", "q"):
            break
        if not text:
            continue

        reqs = extract_requirements(text, skills)
        if not reqs:
            print("Couldn't detect skills. Try mentioning technologies, "
                  "e.g. 'REST API with Node.js and PostgreSQL'.\n")
            continue

        print("Detected requirements:", reqs)
        print("If a detected skill is WRONG, type its name (example: Node.js).")
        remove = input("Skill(s) to remove, or press Enter to keep all: ")
        for name in remove.split(","):
            reqs.pop(resolve_skill(name, by_lower), None)

        if not reqs:
            print("No skills left.\n")
            continue

        top = compute_recommendations_from_reqs(reqs)
        print("\nRecommended employees:\n")
        print(explain(reqs, top))