# Text Summarizer Web App — React + FastAPI + NLTK + Gemini

> Complete reconstructed source package | 2 November 2026 | Local development | No database

A beginner-friendly full-stack web application that accepts pasted text and summarizes it in **two modes**:

- **Extractive:** NLTK chooses important sentences from the original text using word-frequency scoring. It runs locally in the Python backend after NLTK data has been installed.
- **Abstractive:** Google's Gemini API generates a newly worded summary that aims to preserve names, facts, and important figures. An API key is needed; LLM output can still contain factual errors.

This ZIP reconstructs the newer React/FastAPI implementation described in the project conversations. It is **not** a clone of the public GitHub repository, which currently contains the earlier Streamlit-only app at <https://github.com/Vanshul-Thakur/text-summarizer>. It has not been pushed to GitHub or deployed.

## Project status

- Backend API, schemas, NLTK extractive algorithm, Gemini integration, React/Tailwind UI, tests, and example environments: **included in this package**.
- Reconstructed backend contract/algorithm tests: **20 passed using a temporary SDK-import stub in this build environment**; real `google-genai` package was unavailable locally. The test suite itself does not include the stub; installing requirements enables normal testing.
- Frontend API unit tests: **6 passed** using the built-in Node test runner.
- Real Gemini API call: **not tested for this ZIP** (no API key supplied). Previous project conversations reported that a live Gemini request worked.
- NLTK corpus installation and Vite production build: **not tested in this build environment** (package registries were unreachable). Run the setup below on your machine.

## Architecture

```text
Browser (React + Tailwind) http://localhost:5173
             |
             | POST /summarize  {"text":"...","mode":"extractive|abstractive"}
             v
FastAPI (Python) http://127.0.0.1:8000
       | Pydantic validation / CORS
       |---- extractive --> NLTK tokenizer + frequency scoring (local)
       |---- abstractive --> Google Gen AI Python SDK --> Gemini API (remote)
             |
             v
        {"summary":"...","mode":"..."} --> React result panel
```

There is **no database, login, file uploads, history, or RAG** in this version.

## Full project tree

```text
Text_Summarizer_Complete/
├── .gitignore
├── README.md                       # Project index + launch instructions
├── Progress.md                     # Actual status & remaining work
├── Glossary.md                     # Definitions for interviews
├── Project_Notes.docx              # Detailed project and code explanation
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CODE_WALKTHROUGH.md          # Line-by-line explanations by file
│   ├── API_EXAMPLES.md
│   ├── INTERVIEW_PREP.md
│   └── VERIFICATION.md
├── backend/
│   ├── .env.example                 # Copy to .env and insert private key
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                 # Load backend/.env, parse CORS origins
│   │   ├── schemas.py                # Pydantic input and output contracts
│   │   ├── main.py                   # FastAPI routes and error handling
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── extractive.py         # Local NLTK algorithm
│   │       └── abstractive.py        # Gemini-only SDK integration
│   ├── scripts/
│   │   └── download_nltk_data.py
│   └── tests/
│       ├── test_api.py
│       └── test_extractive.py
└── frontend/
    ├── .env.example
    ├── .env.development             # Local backend address
    ├── index.html
    ├── package.json
    ├── vite.config.js               # React + Tailwind v4 Vite plugins
    ├── public/favicon.svg
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                  # Input, modes, loading, errors, results
    │   ├── api.js                   # Fetch request + error translation
    │   └── index.css                # Tailwind v4 import + custom layout
    └── tests/api.test.js
```

## Prerequisites

- Python 3.11+ (project conversations tested Python 3.13.7).
- Node.js 20.19+ or 22.12+, and npm (for current Vite 7).
- Internet connection for dependency installations, initial NLTK language-data download, and abstractive mode.
- Google Gemini API key for abstractive mode. **Not required for extractive mode.**

## 1. Start the backend (Terminal window 1)

From the extracted project folder:

```bash
cd Text_Summarizer_Complete/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
```

Edit `backend/.env` in VS Code and replace the placeholder with your actual Gemini key (keep it private). The default model is `gemini-3.5-flash-lite`. If you only want extractive mode, leave the placeholder and avoid selecting abstractive mode.

Download the NLTK resources (one-time setup):

```bash
python scripts/download_nltk_data.py
python -m uvicorn app.main:app --reload
```

Open:

- Health: <http://127.0.0.1:8000/health>
- Swagger UI (OpenAPI): <http://127.0.0.1:8000/docs>
- OpenAPI JSON: <http://127.0.0.1:8000/openapi.json>

The root path `/` intentionally has no API handler: a 404 there is normal. `GET /summarize` correctly returns 405 because it accepts POST only.

## 2. Start the frontend (Terminal window 2)

```bash
cd Text_Summarizer_Complete/frontend
npm install
npm run dev
```

Open the printed development address, usually <http://localhost:5173>. The included `.env.development` points the browser to `http://127.0.0.1:8000`, avoiding the earlier preview error **“Backend URL is not configured.”**

If you run a hosted browser preview, `127.0.0.1` points to the preview container rather than your Mac. Set `VITE_API_URL` to a **publicly reachable backend URL** in that environment and redeploy/restart Vite. Backend `FRONTEND_ORIGINS` must include the frontend origin.

## 3. How to use

1. Paste text or choose **Try example text**.
2. Select **Extractive** (original sentences) or **Abstractive** (Gemini rewrites).
3. Click **Summarize**; wait for the result on the right.
4. Copy the summary or clear the form. The input limit is 20,000 characters.

## 4. Run tests

Backend (activate the backend environment first):

```bash
cd Text_Summarizer_Complete/backend
python -m pytest -v
```

Frontend API-unit tests:

```bash
cd Text_Summarizer_Complete/frontend
npm run test:unit
npm run build
```

Backend tests mock the Gemini service and tokenizers, so no API call or NLTK download is required **for these automated tests**; installing the Python requirements is still necessary. Run a real end-to-end test manually after configuring the API key and resources.

## 5. API contract

`GET /health` returns `{"status":"ok"}`.

`POST /summarize` accepts JSON:

```json
{"text":"Python is useful for APIs. FastAPI is a Python framework.","mode":"extractive"}
```

and returns JSON:

```json
{"summary":"Python is useful for APIs.","mode":"extractive"}
```

The response above is an **illustrative format**, not a guaranteed output for that input. See [`docs/API_EXAMPLES.md`](docs/API_EXAMPLES.md) for cURL examples and failure codes.

## 6. Configuration, security, and limitations

- Keep `GEMINI_API_KEY` **only in `backend/.env`**, never in `VITE_` variables or React components.
- Do not commit or include your real `.env`. `.gitignore` excludes secret files.
- `VITE_API_URL` is intentionally public because it is a browser URL.
- Backend CORS defaults to localhost Vite origins; configure `FRONTEND_ORIGINS` for deployment.
- Extractive scoring is heuristic and tuned for English; it is not a trained ML model.
- Gemini is an external hosted LLM; **you are using an API, not training a model**.
- Input text selected for abstractive summarization leaves your backend for Google's API. Do not submit confidential text without reviewing applicable privacy requirements.
- AI summaries should be reviewed, especially for numerical facts.
- Current code is a learning project, not a hardened production deployment: no user auth, rate limiting, usage quotas, observability, or cost controls.

## 7. Documentation index

| File | Use |
|---|---|
| [Progress.md](Progress.md) | Phase-by-phase progress and blockers |
| Project_Notes.docx | Detailed concepts and explanation for study/revision |
| [Glossary.md](Glossary.md) | Short definitions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Request flow, design choices, tradeoffs |
| [docs/CODE_WALKTHROUGH.md](docs/CODE_WALKTHROUGH.md) | File-by-file / statement-by-statement overview |
| [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md) | Request examples, troubleshooting |
| [docs/INTERVIEW_PREP.md](docs/INTERVIEW_PREP.md) | Interview answers and follow-up questions |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | Precise test evidence and what remains unverified |

## Official references

- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/latest/
- NLTK: https://www.nltk.org/data.html
- Google Gen AI Python SDK: https://googleapis.github.io/python-genai/
- Google Gemini 3.5 Flash-Lite: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- Vite: https://vite.dev/guide/
- Tailwind v4 with Vite: https://tailwindcss.com/docs/installation/using-vite

**Next recommended step:** install dependencies on your Mac, run all tests, manually test both modes with your real Gemini key, then connect a deployment after confirming locally.
