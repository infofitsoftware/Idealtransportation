from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from routers import auth_router, transaction, bill_of_lading
from dependencies import get_current_active_user
from database import get_db, SQLALCHEMY_DATABASE_URL
from utils.logger import setup_logger
import logging

# Load environment variables
load_dotenv()

# Setup basic logging if logger setup fails
try:
    logger = setup_logger(__name__, "app.log")
except Exception as e:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to setup logger: {e}")

# Create FastAPI app
app = FastAPI(title="Ideal Transportation Solutions API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(transaction.router, prefix="/transactions", tags=["transactions"])
app.include_router(bill_of_lading.router, prefix="/bol", tags=["bill_of_lading"])

@app.on_event("startup")
async def startup_event():
    try:
        # Test database connection
        db = next(get_db())
        db.execute("SELECT 1")
        logger.info("Database connection successful")
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        logger.error(f"Database URL: {SQLALCHEMY_DATABASE_URL}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown complete")

# Test database connection
@app.get("/")
async def root():
    try:
        logger.info("Root endpoint accessed")
        return {"message": "Welcome to Ideal Transportation Solutions API"}
    except Exception as e:
        logger.error(f"Error in root endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Test database connection
        db = next(get_db())
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

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