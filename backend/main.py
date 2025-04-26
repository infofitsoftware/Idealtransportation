from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from routers import auth_router, transaction
from dependencies import get_current_active_user
from database import get_db
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Setup logger
logger = setup_logger(__name__, "app.log")

# Create FastAPI app
app = FastAPI(title="Ideal Transportation Solutions API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(transaction.router, prefix="/transactions", tags=["transactions"])

@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown complete")

# Test database connection
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Ideal Transportation Solutions API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Protected route example
@app.get("/dashboard")
async def dashboard(current_user = Depends(get_current_active_user)):
    return {
        "message": f"Welcome to your dashboard, {current_user.full_name}!",
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "is_superuser": current_user.is_superuser
        }
    } 