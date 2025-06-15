from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import contextmanager
import logging
import os
from dotenv import load_dotenv
from routers import auth_router, transaction, bill_of_lading
from dependencies import get_current_active_user
from database import get_db, engine, SessionLocal
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Configure logging
def setup_logging():
    log_dir = os.getenv('LOG_DIR', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Create handlers
    info_handler = logging.FileHandler(os.path.join(log_dir, 'ideal-transportation.log'))
    error_handler = logging.FileHandler(os.path.join(log_dir, 'ideal-transportation.error.log'))
    error_handler.setLevel(logging.ERROR)
    console_handler = logging.StreamHandler()
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[info_handler, error_handler, console_handler]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

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
    """Initialize database connection on startup"""
    try:
        # Test database connection using engine.connect()
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.scalar()
            logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        logger.error(f"Database URL: {os.getenv('DATABASE_URL')}")
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
        logger.error(f"Error in root endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT 1"))
            db.commit()
            return {
                "status": "healthy",
                "database": "connected",
                "version": "1.0.0"
            }
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )

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