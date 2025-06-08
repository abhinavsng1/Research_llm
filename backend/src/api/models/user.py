from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from api.models.base import BaseResponse

class UserCreate(BaseModel):
    """Model for creating a new user."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    company: Optional[str] = None

class UserLogin(BaseModel):
    """Model for user login."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Model for user data response (excludes sensitive info)."""
    id: str
    email: str
    full_name: Optional[str] = None
    company: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserUpdate(BaseModel):
    """Model for updating user information."""
    full_name: Optional[str] = None
    company: Optional[str] = None

class TokenResponse(BaseModel):
    """Model for authentication token response."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class LLMUsage(BaseModel):
    """Model for tracking LLM usage per user."""
    id: Optional[str] = None
    user_id: str
    model_used: str
    provider: str
    tokens_used: int
    cost: float
    query_type: str
    created_at: Optional[datetime] = None

class UserUsageStats(BaseModel):
    """Model for user usage statistics."""
    total_queries: int
    total_tokens: int
    total_cost: float
    queries_today: int
    most_used_model: str
    usage_by_model: dict