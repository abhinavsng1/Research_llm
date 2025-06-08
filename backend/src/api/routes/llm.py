#routes/llm.py

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..models.llm import LLMRequest, LLMResponse, LLMProviderConfig
from ..models.base import BaseResponse, ErrorResponse
from ...services.llm_service import LLMService
from ...core.auth import get_current_user

router = APIRouter()
llm_service = LLMService()

@router.post("/query", response_model=LLMResponse)
async def query_llm(request: LLMRequest):
    try:
        print(f"Received request: {request}")
        response = await llm_service.process_query(request)
        return response
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models", response_model=List[str])
async def list_available_models():
    try:
        return await llm_service.get_available_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/providers", response_model=List[LLMProviderConfig])
async def list_providers():
    try:
        return await llm_service.get_providers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/providers", response_model=LLMProviderConfig)
async def add_provider(provider: LLMProviderConfig):
    try:
        return await llm_service.add_provider(provider)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage", response_model=dict)
async def get_usage_stats():
    try:
        return await llm_service.get_usage_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 