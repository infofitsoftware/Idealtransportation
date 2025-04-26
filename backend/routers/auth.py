from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any, Optional
from jose import JWTError, jwt

from models.user import User
from schemas.auth import UserCreate, User as UserSchema, Token
from schemas.user import UserResponse
from utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    verify_token,
)
from database import get_db
from dependencies import get_current_user
from utils.logger import setup_logger

# Setup logger
logger = setup_logger(__name__, "auth.log")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_user(db: Session, email: str):
    logger.info(f"Looking up user with email: {email}")
    user = db.query(User).filter(User.email == email).first()
    if user:
        logger.info(f"User found: {user.email}")
    else:
        logger.info(f"User not found: {email}")
    return user

def authenticate_user(db: Session, email: str, password: str):
    logger.info(f"Authenticating user: {email}")
    user = get_user(db, email)
    if not user:
        logger.warning(f"Authentication failed: User not found - {email}")
        return False
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Authentication failed: Invalid password - {email}")
        return False
    logger.info(f"Authentication successful: {email}")
    return user

@router.post("/register", response_model=UserSchema)
def register_user(user: UserCreate, db: Session = Depends(get_db)) -> Any:
    logger.info(f"Registering new user: {user.email}")
    db_user = get_user(db, email=user.email)
    if db_user:
        logger.warning(f"Registration failed: Email already registered - {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User registered successfully: {user.email}")
    return db_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    logger.info(f"Login attempt for user: {form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Login failed: Invalid credentials - {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"Login successful: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        logger.info("Validating token for /me endpoint")
        payload = verify_token(token)
        email = str(payload.get("sub", ""))
        
        if not email:
            logger.error("Invalid token payload: missing email")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing email",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Looking up user with email: {email}")
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            logger.error(f"User not found: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"User authenticated successfully: {email}")
        return user
    except JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) 