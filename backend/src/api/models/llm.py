#models/llm.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from .base import BaseResponse

class LLMRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gpt-3.5-turbo"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    stream: Optional[bool] = False

class LLMResponse(BaseResponse):
    response: str
    provider: str
    cost: float
    latency: float
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None

class LLMProviderConfig(BaseModel):
    name: str
    api_key: str
    models: List[str]
    is_active: bool = True
    priority: int = 1 