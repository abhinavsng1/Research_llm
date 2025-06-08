from pydantic import BaseSettings, Field
from typing import List, Optional
import os

class Settings(BaseSettings):
    """
    Application configuration using Pydantic BaseSettings.
    Automatically loads from environment variables and .env file.
    """
    
    # Application settings
    app_name: str = Field(default="ResearchLLM Pro", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    
    # Supabase settings
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_key: Optional[str] = Field(None, env="SUPABASE_SERVICE_KEY")
    
    # JWT settings
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS settings
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        env="CORS_ORIGINS"
    )
    
    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # LLM Provider settings
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    google_api_key: Optional[str] = Field(None, env="GOOGLE_API_KEY")
    
    # Rate limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    
    # Usage quotas (default limits)
    default_monthly_token_limit: int = Field(default=100000, env="DEFAULT_MONTHLY_TOKEN_LIMIT")
    default_daily_query_limit: int = Field(default=1000, env="DEFAULT_DAILY_QUERY_LIMIT")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS origins to list if it's a string."""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins

# Global settings instance
settings = Settings()