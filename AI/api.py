"""Small HTTP service that exposes the recommender to your main app.

Run:  uvicorn api:app --port 8000
Docs: http://localhost:8000/docs  (interactive test page)
"""
from typing import Dict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agent import extract_requirements_with_status, explain, get_skills
from recommend_employees import compute_recommendations_from_reqs

app = FastAPI(title="Employee Recommendation Service")


class AnalyzeRequest(BaseModel):
    text: str


class RecommendRequest(BaseModel):
    # Skills the PM confirmed (after removing wrong ones): {"Node.js": 3}
    requirements: Dict[str, int]
    top_n: int = 5


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/skills")
def skills():
    return {"skills": get_skills()}


@app.post("/analyze")
def analyze(body: AnalyzeRequest):
    """Step 1: free text -> detected skills (the PM can edit them in the UI)."""
    if not body.text.strip():
        raise HTTPException(400, "text is empty")
    reqs, llm_ok = extract_requirements_with_status(body.text)
    return {
        "requirements": reqs,
        # False = the LLM was unavailable; only keyword matching was used
        "llm_used": llm_ok,
    }


@app.post("/recommend")
def recommend(body: RecommendRequest):
    """Step 2: confirmed skills -> ranked employees."""
    known = set(get_skills())
    unknown = [s for s in body.requirements if s not in known]
    bad_levels = [s for s, l in body.requirements.items() if not 1 <= l <= 5]
    if unknown or bad_levels:
        raise HTTPException(400, {
            "error": "invalid requirements",
            "unknown_skills": unknown,
            "invalid_levels": bad_levels,
        })
    reqs = dict(body.requirements)
    if not reqs:
        raise HTTPException(400, "no valid skills provided")
    results = compute_recommendations_from_reqs(reqs, body.top_n)
    return {
        "requirements": reqs,
        "recommendations": results,
        "summary": explain(reqs, results),
    }