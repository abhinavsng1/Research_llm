#main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import llm
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="ResearchLLM Pro",
    description="Enterprise-grade AI research platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(llm.router, prefix="/llm", tags=["llm"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to ResearchLLM Pro",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    } 