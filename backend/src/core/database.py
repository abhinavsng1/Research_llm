from supabase import create_client, Client
from typing import Optional
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    Manages Supabase database connections and operations.
    Singleton pattern ensures only one connection throughout the app.
    """
    _instance: Optional['DatabaseManager'] = None
    _client: Optional[Client] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Supabase client with environment variables."""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
            
            self._client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    @property
    def client(self) -> Client:
        """Get the Supabase client instance."""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    async def health_check(self) -> bool:
        """Check if database connection is healthy."""
        try:
            # Simple query to test connection
            result = self._client.table('users').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False

# Global database instance
db_manager = DatabaseManager()