from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.routes import llm
from api.routes import auth
from core.database import db_manager
from dotenv import load_dotenv
import logging
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title=os.getenv("APP_NAME", "ResearchLLM Pro"),
    description="Enterprise-grade AI research platform with Supabase integration",
    version=os.getenv("APP_VERSION", "1.0.0"),
    docs_url="/docs" if os.getenv("DEBUG", "False").lower() == "true" else None,
    redoc_url="/redoc" if os.getenv("DEBUG", "False").lower() == "true" else None,
)

# Configure CORS with environment-based settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8080").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers with proper prefixes
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(llm.router, prefix="/llm", tags=["llm"])

@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler.
    Initialize database connections and perform health checks.
    """
    try:
        logger.info("Starting ResearchLLM Pro application...")
        
        # Test database connection
        is_healthy = await db_manager.health_check()
        if not is_healthy:
            logger.warning("Database health check failed, but continuing startup")
        else:
            logger.info("Database connection established successfully")
        
        logger.info("Application startup completed successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        # Don't raise exception to allow app to start even if DB is temporarily unavailable

@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event handler.
    Clean up resources and connections.
    """
    logger.info("Shutting down ResearchLLM Pro application...")
    # Add any cleanup code here if needed
    logger.info("Application shutdown completed")

@app.get("/")
async def root():
    """
    Root endpoint providing application information.
    
    Returns:
        Application status and basic information
    """
    return {
        "message": f"Welcome to {os.getenv('APP_NAME', 'ResearchLLM Pro')}",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "status": "operational",
        "features": [
            "User Authentication",
            "LLM Integration",
            "Usage Tracking",
            "Multi-Provider Support"
        ],
        "endpoints": {
            "auth": "/auth",
            "llm": "/llm",
            "docs": "/docs" if os.getenv("DEBUG", "False").lower() == "true" else "disabled",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Returns:
        Health status of all application components
    
    Raises:
        HTTPException: If critical components are unhealthy
    """
    try:
        # Check database health
        db_healthy = await db_manager.health_check()
        
        health_status = {
            "status": "healthy" if db_healthy else "degraded",
            "timestamp": "2024-01-01T00:00:00Z",  # You might want to use actual timestamp
            "components": {
                "database": "healthy" if db_healthy else "unhealthy",
                "api": "healthy"
            },
            "version": os.getenv("APP_VERSION", "1.0.0")
        }
        
        # If database is unhealthy, return 503 status
        if not db_healthy:
            raise HTTPException(status_code=503, detail=health_status)
        
        return health_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "unhealthy",
                "error": "Health check failed",
                "components": {
                    "database": "unknown",
                    "api": "unhealthy"
                }
            }
        )

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors with custom response."""
    return {
        "success": False,
        "message": "Endpoint not found",
        "error_code": "NOT_FOUND",
        "path": str(request.url.path)
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors with custom response."""
    logger.error(f"Internal server error on {request.url.path}: {str(exc)}")
    return {
        "success": False,
        "message": "Internal server error",
        "error_code": "INTERNAL_ERROR",
        "path": str(request.url.path)
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("DEBUG", "False").lower() == "true",
        log_level="info"
    )