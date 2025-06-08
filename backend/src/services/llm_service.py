from typing import List, Dict, Any, Optional
from api.models.llm import LLMRequest, LLMResponse, LLMProviderConfig
from api.models.user import LLMUsage, UserUsageStats
from core.database import db_manager
import time
import logging
from datetime import datetime, date, timedelta

logger = logging.getLogger(__name__)

class LLMService:
    """
    Enhanced LLM Service with Supabase integration for user tracking.
    """
    
    def __init__(self):
        self.providers: Dict[str, LLMProviderConfig] = {}
        self.supabase = db_manager.client
        # Initialize with default providers
        self._initialize_default_providers()

    def _initialize_default_providers(self):
        """Initialize default LLM providers."""
        default_providers = [
            LLMProviderConfig(
                name="openai",
                api_key="",  # Will be set via environment or admin panel
                models=["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
                is_active=False,
                priority=1
            ),
            LLMProviderConfig(
                name="anthropic",
                api_key="",
                models=["claude-2", "claude-3-sonnet", "claude-3-opus"],
                is_active=False,
                priority=2
            )
        ]
        
        for provider in default_providers:
            self.providers[provider.name] = provider

    async def process_query(self, request: LLMRequest, user_id: str) -> LLMResponse:
        """
        Process LLM query and track usage.
        
        Args:
            request: LLM request data
            user_id: ID of the user making the request
        
        Returns:
            LLM response with usage tracking
        """
        start_time = time.time()
        
        try:
            # TODO: Implement actual LLM provider integration
            # For now, return mock response
            response_text = f"Processed query for user {user_id}: {request.prompt}"
            latency = time.time() - start_time
            
            # Calculate mock costs and tokens
            tokens_used = len(request.prompt.split()) * 2  # Mock calculation
            cost = tokens_used * 0.0001  # Mock cost per token
            
            # Create response
            response = LLMResponse(
                success=True,
                message="Query processed successfully",
                response=response_text,
                provider="mock",
                cost=cost,
                latency=latency,
                tokens_used=tokens_used,
                model_used=request.model
            )
            
            # Track usage in database
            await self._track_usage(
                user_id=user_id,
                model_used=request.model,
                provider="mock",
                tokens_used=tokens_used,
                cost=cost,
                query_type="chat"  # Could be categorized further
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing query for user {user_id}: {str(e)}")
            raise

    async def _track_usage(self, user_id: str, model_used: str, provider: str, 
                          tokens_used: int, cost: float, query_type: str):
        """
        Track LLM usage in Supabase.
        
        Args:
            user_id: User ID
            model_used: Model that was used
            provider: Provider name
            tokens_used: Number of tokens consumed
            cost: Cost of the query
            query_type: Type of query (chat, completion, etc.)
        """
        try:
            usage_data = {
                "user_id": user_id,
                "model_used": model_used,
                "provider": provider,
                "tokens_used": tokens_used,
                "cost": cost,
                "query_type": query_type,
                "created_at": datetime.utcnow().isoformat()
            }
            
            self.supabase.table('llm_usage').insert(usage_data).execute()
            logger.info(f"Usage tracked for user {user_id}: {tokens_used} tokens, ${cost:.4f}")
            
        except Exception as e:
            logger.error(f"Failed to track usage for user {user_id}: {str(e)}")
            # Don't raise exception here to avoid disrupting the main flow

    async def get_available_models(self) -> List[str]:
        """Get list of available models from active providers."""
        models = []
        for provider in self.providers.values():
            if provider.is_active:
                models.extend(provider.models)
        
        # Add default models if no providers are active
        if not models:
            models = ["gpt-3.5-turbo", "gpt-4", "claude-2"]
        
        return list(set(models))  # Remove duplicates

    async def get_providers(self) -> List[LLMProviderConfig]:
        """Get list of configured providers."""
        return list(self.providers.values())

    async def add_provider(self, provider: LLMProviderConfig) -> LLMProviderConfig:
        """
        Add new LLM provider.
        
        Args:
            provider: Provider configuration
        
        Returns:
            Added provider configuration
        """
        self.providers[provider.name] = provider
        
        # TODO: Save to database for persistence
        # For now, just store in memory
        
        return provider

    async def get_user_usage_stats(self, user_id: str, days: int = 30) -> UserUsageStats:
        """
        Get usage statistics for a specific user.
        
        Args:
            user_id: User ID
            days: Number of days to look back (default: 30)
        
        Returns:
            User usage statistics
        """
        try:
            # Calculate date range
            from_date = (datetime.now() - timedelta(days=days)).isoformat()
            today = date.today().isoformat()
            
            # Get total usage stats
            total_usage = self.supabase.table('llm_usage')\
                .select('tokens_used, cost, model_used')\
                .eq('user_id', user_id)\
                .gte('created_at', from_date)\
                .execute()
            
            # Get today's usage
            today_usage = self.supabase.table('llm_usage')\
                .select('id')\
                .eq('user_id', user_id)\
                .gte('created_at', today)\
                .execute()
            
            # Calculate statistics
            total_queries = len(total_usage.data)
            total_tokens = sum(item['tokens_used'] for item in total_usage.data)
            total_cost = sum(item['cost'] for item in total_usage.data)
            queries_today = len(today_usage.data)
            
            # Find most used model
            model_counts = {}
            for item in total_usage.data:
                model = item['model_used']
                model_counts[model] = model_counts.get(model, 0) + 1
            
            most_used_model = max(model_counts.keys(), key=model_counts.get) if model_counts else "None"
            
            return UserUsageStats(
                total_queries=total_queries,
                total_tokens=total_tokens,
                total_cost=total_cost,
                queries_today=queries_today,
                most_used_model=most_used_model,
                usage_by_model=model_counts
            )
            
        except Exception as e:
            logger.error(f"Failed to get usage stats for user {user_id}: {str(e)}")
            # Return empty stats on error
            return UserUsageStats(
                total_queries=0,
                total_tokens=0,
                total_cost=0.0,
                queries_today=0,
                most_used_model="None",
                usage_by_model={}
            )

    async def get_usage_stats(self) -> Dict[str, Any]:
        """
        Get global usage statistics (admin function).
        
        Returns:
            Global usage statistics
        """
        try:
            # Get all usage data
            usage_data = self.supabase.table('llm_usage')\
                .select('user_id, tokens_used, cost, model_used, created_at')\
                .execute()
            
            if not usage_data.data:
                return {
                    "total_users": 0,
                    "total_queries": 0,
                    "total_tokens": 0,
                    "total_cost": 0.0,
                    "popular_models": {}
                }
            
            # Calculate global stats
            unique_users = set(item['user_id'] for item in usage_data.data)
            total_queries = len(usage_data.data)
            total_tokens = sum(item['tokens_used'] for item in usage_data.data)
            total_cost = sum(item['cost'] for item in usage_data.data)
            
            # Model popularity
            model_counts = {}
            for item in usage_data.data:
                model = item['model_used']
                model_counts[model] = model_counts.get(model, 0) + 1
            
            return {
                "total_users": len(unique_users),
                "total_queries": total_queries,
                "total_tokens": total_tokens,
                "total_cost": total_cost,
                "popular_models": dict(sorted(model_counts.items(), key=lambda x: x[1], reverse=True))
            }
            
        except Exception as e:
            logger.error(f"Failed to get global usage stats: {str(e)}")
            return {
                "total_users": 0,
                "total_queries": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "popular_models": {}
            }