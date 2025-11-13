from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = None
    is_superuser: bool = Field(default=False, description="Set to True for admin role")
    is_active: bool = Field(default=True, description="Set to False to deactivate user") 