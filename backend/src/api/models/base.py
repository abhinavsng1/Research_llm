#models/base.py

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseResponse):
    error_code: str
    details: Optional[List[str]] = None

class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 10
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc" 