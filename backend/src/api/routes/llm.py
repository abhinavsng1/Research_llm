from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from api.models.llm import LLMRequest, LLMResponse, LLMProviderConfig
from api.models.base import BaseResponse, ErrorResponse
from api.models.user import UserUsageStats
from services.llm_service import LLMService
from core.auth import get_current_active_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
llm_service = LLMService()

@router.post("/query", response_model=LLMResponse)
async def query_llm(
    request: LLMRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Process LLM query for authenticated user.
    
    Args:
        request: LLM request data
        current_user: Current authenticated user
    
    Returns:
        LLM response with usage tracking
    
    Raises:
        HTTPException: If query processing fails
    """
    try:
        logger.info(f"Processing LLM query for user {current_user['id']}: {request.model}")
        
        # Process query with user tracking
        response = await llm_service.process_query(request, current_user["id"])
        
        logger.info(f"Query processed successfully for user {current_user['id']}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing query for user {current_user['id']}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@router.get("/models", response_model=List[str])
async def list_available_models(current_user: dict = Depends(get_current_active_user)):
    """
    List available LLM models for authenticated user.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        List of available model names
    
    Raises:
        HTTPException: If model listing fails
    """
    try:
        models = await llm_service.get_available_models()
        logger.info(f"Listed {len(models)} models for user {current_user['id']}")
        return models
        
    except Exception as e:
        logger.error(f"Error listing models for user {current_user['id']}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/providers", response_model=List[LLMProviderConfig])
async def list_providers(current_user: dict = Depends(get_current_active_user)):
    """
    List LLM providers for authenticated user.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        List of LLM provider configurations
    
    Raises:
        HTTPException: If provider listing fails
    """
    try:
        providers = await llm_service.get_providers()
        logger.info(f"Listed {len(providers)} providers for user {current_user['id']}")
        return providers
        
    except Exception as e:
        logger.error(f"Error listing providers for user {current_user['id']}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/providers", response_model=LLMProviderConfig)
async def add_provider(
    provider: LLMProviderConfig,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Add new LLM provider (admin function).
    
    Args:
        provider: LLM provider configuration
        current_user: Current authenticated user
    
    Returns:
        Added provider configuration
    
    Raises:
        HTTPException: If provider addition fails or user lacks permission
    """
    try:
        # TODO: Add admin role check
        # For now, allow any authenticated user to add providers
        
        added_provider = await llm_service.add_provider(provider)
        logger.info(f"Provider {provider.name} added by user {current_user['id']}")
        return added_provider
        
    except Exception as e:
        logger.error(f"Error adding provider for user {current_user['id']}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/me", response_model=UserUsageStats)
async def get_my_usage_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get usage statistics for current authenticated user.
    
    Args:
        days: Number of days to look back (default: 30)
        current_user: Current authenticated user
    
    Returns:
        User usage statistics
    
    Raises:
        HTTPException: If stats retrieval fails
    """
    try:
        stats = await llm_service.get_user_usage_stats(current_user["id"], days)
        logger.info(f"Retrieved usage stats for user {current_user['id']}")
        return stats
        
    except Exception as e:
        logger.error(f"Error getting usage stats for user {current_user['id']}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage", response_model=Dict[str, Any])
async def get_global_usage_stats(current_user: dict = Depends(get_current_active_user)):
    """
    Get global usage statistics (admin function).
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Global usage statistics
    
    Raises:
        HTTPException: If stats retrieval fails or user lacks permission
    """
    try:
        # TODO: Add admin role check
        # For now, allow any authenticated user to view global stats
        
        stats = await llm_service.get_usage_stats()
        logger.info(f"Retrieved global usage stats for user {current_user['id']}")
        return stats
        
    except Exception as e:
        logger.error(f"Error getting global usage stats for user {current_user['id']}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", response_model=BaseResponse)
async def llm_health_check():
    """
    Health check endpoint for LLM service.
    
    Returns:
        Health status response
    """
    try:
        # Check if service is operational
        models = await llm_service.get_available_models()
        
        return BaseResponse(
            success=True,
            message="LLM service is healthy",
            data={
                "available_models": len(models),
                "status": "operational"
            }
        )
        
    except Exception as e:
        logger.error(f"LLM health check failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="LLM service health check failed"
        )