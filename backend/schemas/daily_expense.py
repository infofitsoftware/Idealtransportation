from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class DailyExpenseBase(BaseModel):
    date: date
    diesel_amount: float = Field(..., description="Diesel amount")
    diesel_location: str
    def_amount: float = Field(..., description="DEF amount")
    def_location: str
    other_expense_description: Optional[str] = None
    other_expense_amount: Optional[float] = Field(None, description="Other expense amount")
    other_expense_location: Optional[str] = None
    total: float = Field(..., description="Total amount")

    class Config:
        from_attributes = True
        json_encoders = {
            float: lambda v: float(v) if v is not None else None
        }

class DailyExpenseCreate(DailyExpenseBase):
    pass

class DailyExpense(DailyExpenseBase):
    id: int = Field(..., description="Daily expense ID")
    user_id: int = Field(..., description="User ID")
    driver_name: Optional[str] = Field(None, description="Driver name from user")

    class Config:
        from_attributes = True
        json_encoders = {
            float: lambda v: float(v) if v is not None else None,
            int: lambda v: int(v) if v is not None else None
        } 