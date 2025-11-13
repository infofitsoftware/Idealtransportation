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
from dependencies import get_current_user, get_current_admin_user
from utils.logger import setup_logger
from schemas.user import AdminUserCreate
from typing import List

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

# Admin-only endpoints for user management
@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Create a new user (Admin only)"""
    logger.info(f"Admin {current_user.email} creating new user: {user_data.email}")
    
    # Check if user already exists
    existing_user = get_user(db, user_data.email)
    if existing_user:
        logger.warning(f"User creation failed: Email already exists - {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create new user
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_superuser=user_data.is_superuser,
        is_active=user_data.is_active,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"User created successfully by admin {current_user.email}: {user_data.email}")
    return db_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Get all users (Admin only)"""
    logger.info(f"Admin {current_user.email} fetching all users")
    users = db.query(User).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Get a specific user by ID (Admin only)"""
    logger.info(f"Admin {current_user.email} fetching user ID: {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Update a user (Admin only)"""
    logger.info(f"Admin {current_user.email} updating user ID: {user_id}")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check if email is being changed and if it's already taken
    if user_data.email != db_user.email:
        existing_user = get_user(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    
    # Update user fields
    db_user.email = user_data.email
    if user_data.password:
        db_user.hashed_password = get_password_hash(user_data.password)
    db_user.full_name = user_data.full_name
    db_user.is_superuser = user_data.is_superuser
    db_user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"User updated successfully by admin {current_user.email}: {user_id}")
    return db_user

@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """Delete a user (Admin only)"""
    logger.info(f"Admin {current_user.email} deleting user ID: {user_id}")
    
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    db.delete(db_user)
    db.commit()
    
    logger.info(f"User deleted successfully by admin {current_user.email}: {user_id}")
    return {"detail": "User deleted successfully"}