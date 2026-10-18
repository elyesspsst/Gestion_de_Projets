# Gestion de Projets

Project and task management app with an **AI employee recommender**: a project manager describes a task in free text, the system detects the required skills, then ranks the best-suited employees (skills match + current workload).

## Architecture

```
Frontend / Postman
        |
Node.js backend (Express, port 3000)   -> auth (JWT) + roles
        |
Python AI service (FastAPI, port 8000) -> skill detection + ranking
        |                \
PostgreSQL (5432)         Ollama (11434, local LLM: qwen2.5:3b)
```

The frontend never calls the Python service directly. Only the Node backend does.

```
GestionProjets/
├── backend/      Node.js + Express + Sequelize (models, routes, migrations, seeders)
├── AI/           Python recommender (FastAPI + Ollama + pandas)
└── frontend/     HTML pages
```

## Requirements

- Node.js 18+
- Python 3.10+
- PostgreSQL
- [Ollama](https://ollama.com) with the `qwen2.5:3b` model

## Setup

### 1. Database

Create a PostgreSQL database (e.g. `gestion_projet`), then run the migrations and seeders from `backend` (tables: users, employees, projects, tasks, skills, employee_skills, task_skills, notifications).

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` with your database and JWT settings. Optional:

```dotenv
AI_SERVICE_URL=http://127.0.0.1:8000
```

Start it:

```bash
node src/server.js
```

### 3. AI service

```bash
cd AI
pip install fastapi uvicorn ollama pandas sqlalchemy psycopg2-binary python-dotenv
```

Create `AI/.env` (see `AI/.env.example`):

```dotenv
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@localhost:5432/gestion_projet
```

If the password contains special characters, URL-encode them (`@` becomes `%40`).

Start it:

```bash
python -m uvicorn api:app --port 8000
```

### 4. Ollama

```bash
ollama pull qwen2.5:3b
ollama serve
```

Without Ollama the system still works: `/analyze` falls back to keyword matching and returns `"llm_used": false`.

## Running everything

Keep these running: PostgreSQL, Ollama, the AI service (8000) and the backend (3000).

## API

All routes require a JWT (`Authorization: Bearer <token>`) and the role `PROJECT_MANAGER` or `ADMIN`.

| Method | URL | Body | Description |
|---|---|---|---|
| POST | `/api/recommend/analyze` | `{"text": "REST API with Node.js"}` | Free text to detected skills |
| POST | `/api/recommend` | `{"requirements": {"Node.js": 3, "SQL": 2}}` | Confirmed skills to ranked employees |

Skill levels are integers from 1 to 5, and skill names must exist in the `skills` table.

Typical flow: call `/analyze`, let the manager correct the detected skills, then send them to `/recommend`.

Errors: `400` invalid input, `401` no token, `403` wrong role, `502/503/504` AI service problem.

### AI service (direct, for debugging)

| Method | URL |
|---|---|
| GET | `http://localhost:8000/health` |
| GET | `http://localhost:8000/skills` |
| POST | `http://localhost:8000/analyze` |
| POST | `http://localhost:8000/recommend` |

Interactive docs: http://localhost:8000/docs

## Scoring

For each employee and each required skill:

```
ratio = min(employee_level / required_level, 1)
skill_score = (0.7 * average(ratio) + 0.3 * weakest(ratio)) * 100
final_score = max(0, skill_score - 10 * current_open_tasks)
```

- The weakest-skill term penalizes candidates who miss a critical skill entirely.
- `current_open_tasks` counts tasks with status `pending` or `in_progress`.
- Ties are broken by surplus (how much the employee exceeds the required levels).

## Demo mode (no database)

If `DATABASE_URL` is not set, the AI service uses synthetic CSV files:

```bash
cd AI
python generate_dataset.py
python add_workload.py
python validate_dataset.py
python recommend_employees.py
```

`train_supervised.py` is an experiment on **simulated** labels. Its metrics do not reflect real-world performance.

## Known limitations

- `seniority` is a fixed placeholder (`mid`) when reading from the database.
- Partially matched skills are not listed as "strengths" in the text summary.
- The workload penalty is flat and ignores task priority and due date.

## Security

Never commit `.env` files. They are listed in `.gitignore`. Use `.env.example` as a template.
