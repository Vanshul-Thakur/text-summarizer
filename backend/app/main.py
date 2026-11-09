"""FastAPI entry point for both summarization modes."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.genai import errors as gemini_errors

from app.config import allowed_origins
from app.schemas import HealthResponse, SummarizeRequest, SummarizeResponse
from app.services.abstractive import (
    EmptyGeminiResponseError,
    MissingGeminiKeyError,
    summarize_abstractive,
)
from app.services.extractive import summarize_extractive

app = FastAPI(
    title="Text Summarizer API",
    description="Local extractive NLP + Gemini-based abstractive summarization.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health() -> HealthResponse:
    """Simple check that the FastAPI process is running."""
    return HealthResponse(status="ok")


@app.post("/summarize", response_model=SummarizeResponse, tags=["Summaries"])
def summarize(request: SummarizeRequest) -> SummarizeResponse:
    """Validate a request and route to local NLTK or remote Gemini."""
    if request.mode == "extractive":
        try:
            summary = summarize_extractive(request.text)
        except LookupError as exc:
            # Missing NLTK language resources are a server-setup issue.
            raise HTTPException(
                status_code=503,
                detail="NLTK data missing. Run: python scripts/download_nltk_data.py",
            ) from exc
    else:
        try:
            summary = summarize_abstractive(request.text)
        except MissingGeminiKeyError as exc:
            raise HTTPException(
                status_code=503,
                detail="Gemini API key is not configured on the backend.",
            ) from exc
        except (gemini_errors.APIError, EmptyGeminiResponseError) as exc:
            raise HTTPException(
                status_code=502,
                detail="Gemini summarization failed. Please try again.",
            ) from exc

    return SummarizeResponse(summary=summary, mode=request.mode)
