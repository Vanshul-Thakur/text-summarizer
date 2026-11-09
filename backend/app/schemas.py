#Pydantic models for the public REST API contract.

from typing import Literal

from pydantic import BaseModel, Field, field_validator


SummaryMode = Literal["extractive", "abstractive"]


class SummarizeRequest(BaseModel):
    # 20,000 characters avoids unbounded API requests and LLM cost.
    text: str = Field(min_length=1, max_length=20_000)
    mode: SummaryMode

    @field_validator("text")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Text must contain at least one non-whitespace character")
        return value.strip()


class SummarizeResponse(BaseModel):
    summary: str
    mode: SummaryMode


class HealthResponse(BaseModel):
    status: Literal["ok"]
