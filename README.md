# Text Summarizer

A full-stack web app that turns long text into concise summaries using **extractive NLP** or **generative AI**.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **Summarization:** NLTK (extractive) and Google Gemini API (abstractive)
- **Database:** None

## Features
- Extractive summaries select important original sentences using word-frequency scoring.
- Abstractive summaries rewrite text through Gemini.
- Input validation, loading/error states, summary copying, and responsive UI.
- Interactive API documentation at `/docs` (Swagger UI).

## Run Locally

**Backend** (set `GEMINI_API_KEY` in `backend/.env`):
```bash
cd backend
pip install -r requirements.txt
python scripts/download_nltk_data.py
uvicorn app.main:app --reload
```

**Frontend** (set `VITE_API_URL=http://127.0.0.1:8000` in `frontend/.env.development`):
```bash
cd frontend
npm install
npm run dev
```

## API
- `GET /health` — health check
- `POST /summarize` — accepts `{"text":"...","mode":"extractive"}` or `"abstractive"`; returns a summary and mode.

## Deployment & Status — 10 Nov 2026
- **Frontend:** [Vercel](https://text-summarizer-iota-umber.vercel.app/)
- **Backend:** [Render](https://text-summarizer-api-5dip.onrender.com/)
- **Verified locally:** 13 backend tests passed in the latest reported run.
- **Pending:** Fix the production NLTK resource-path error and recheck both summarization modes end to end.

**Source:** [GitHub repository](https://github.com/Vanshul-Thakur/text-summarizer)
