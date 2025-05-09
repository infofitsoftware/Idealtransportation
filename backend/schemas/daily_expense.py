from pydantic import BaseModel
from datetime import date
from typing import Optional

class DailyExpenseBase(BaseModel):
    date: date
    diesel_amount: float
    diesel_location: str
    def_amount: float
    def_location: str
    other_expense_description: Optional[str] = None
    other_expense_amount: Optional[float] = None
    other_expense_location: Optional[str] = None
    total: float

class DailyExpenseCreate(DailyExpenseBase):
    pass

class DailyExpense(DailyExpenseBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True 