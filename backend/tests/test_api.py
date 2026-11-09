"""FastAPI contract tests; Gemini is mocked so no API key or credit is spent."""

from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.services.abstractive import MissingGeminiKeyError, EmptyGeminiResponseError

client = TestClient(app)

SAMPLE_TEXT = (
    "Python is a popular programming language. "
    "Python is used for web development. "
    "Many developers use Python for data science. "
    "FastAPI is a Python framework for building APIs."
)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_extractive_summary(monkeypatch):
    monkeypatch.setattr("app.main.summarize_extractive", lambda text: "Python is popular.")
    response = client.post("/summarize", json={"text": SAMPLE_TEXT, "mode": "extractive"})
    assert response.status_code == 200
    assert response.json() == {"summary": "Python is popular.", "mode": "extractive"}


def test_abstractive_summary(monkeypatch):
    monkeypatch.setattr("app.main.summarize_abstractive", lambda text: "Python helps build APIs.")
    response = client.post("/summarize", json={"text": SAMPLE_TEXT, "mode": "abstractive"})
    assert response.status_code == 200
    assert response.json() == {"summary": "Python helps build APIs.", "mode": "abstractive"}


@pytest.mark.parametrize("bad_payload", [
    {"text": "", "mode": "extractive"},
    {"text": "   ", "mode": "extractive"},
    {"text": "Hello", "mode": "invalid"},
    {"text": "Hello"},
    {"mode": "extractive"},
    {"text": "x" * 20_001, "mode": "abstractive"},
])
def test_invalid_request_is_rejected(bad_payload):
    response = client.post("/summarize", json=bad_payload)
    assert response.status_code == 422


def test_missing_gemini_key_returns_503(monkeypatch):
    def missing(_):
        raise MissingGeminiKeyError("no key")
    monkeypatch.setattr("app.main.summarize_abstractive", missing)
    response = client.post("/summarize", json={"text": "Hello", "mode": "abstractive"})
    assert response.status_code == 503
    assert "key" in response.json()["detail"].lower()


def test_empty_gemini_response_returns_502(monkeypatch):
    def empty(_):
        raise EmptyGeminiResponseError("empty")
    monkeypatch.setattr("app.main.summarize_abstractive", empty)
    response = client.post("/summarize", json={"text": "Hello", "mode": "abstractive"})
    assert response.status_code == 502
    assert "Gemini" in response.json()["detail"]


def test_nltk_missing_returns_503(monkeypatch):
    def unavailable(_):
        raise LookupError("stopwords resource unavailable")
    monkeypatch.setattr("app.main.summarize_extractive", unavailable)
    response = client.post("/summarize", json={"text": "Hello", "mode": "extractive"})
    assert response.status_code == 503
    assert "NLTK" in response.json()["detail"]


def test_api_docs_are_generated():
    assert client.get("/docs").status_code == 200
    schema = client.get("/openapi.json").json()
    assert "/summarize" in schema["paths"]


def test_get_summarize_not_allowed():
    assert client.get("/summarize").status_code == 405


def test_cors_local_frontend_origin():
    response = client.options(
        "/summarize",
        headers={
            "origin": "http://localhost:5173",
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_text_is_trimmed(monkeypatch):
    received = {}
    def capture(text):
        received["text"] = text
        return text
    monkeypatch.setattr("app.main.summarize_extractive", capture)
    response = client.post("/summarize", json={"text": "  One sentence.  ", "mode": "extractive"})
    assert response.status_code == 200
    assert received["text"] == "One sentence."
