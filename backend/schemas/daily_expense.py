from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List

# Entry-level schemas
class DailyExpenseEntryBase(BaseModel):
    expense_type: str = Field(..., description="Expense type: Fuel, Toll, Food, Parking, Maintenance, Phone, Misc")
    sub_type: Optional[str] = Field(None, description="Sub-type (e.g., Diesel, Petrol, CNG for Fuel)")
    amount: float = Field(..., gt=0, description="Expense amount")
    location: str = Field(..., description="Location where expense occurred")
    payment_mode: str = Field(..., description="Payment mode: Cash, UPI, Card, Company Wallet, Bank Transfer, Zelle")
    receipt_url: Optional[str] = Field(None, description="URL or path to receipt")
    remarks: Optional[str] = Field(None, description="Additional remarks")

    class Config:
        from_attributes = True

class DailyExpenseEntryCreate(DailyExpenseEntryBase):
    pass

class DailyExpenseEntry(DailyExpenseEntryBase):
    id: int
    daily_expense_id: int

    class Config:
        from_attributes = True

# Daily Expense (Header) schemas
class DailyExpenseBase(BaseModel):
    date: date
    vehicle_number: Optional[str] = Field(None, description="Vehicle number/identifier")
    total: float = Field(0.0, description="Total amount (auto-calculated)")

    class Config:
        from_attributes = True

class DailyExpenseCreate(BaseModel):
    """Schema for creating a daily expense with entries"""
    date: date
    vehicle_number: Optional[str] = None
    entries: List[DailyExpenseEntryCreate] = Field(..., min_items=1, description="List of expense entries")

    class Config:
        from_attributes = True

class DailyExpense(DailyExpenseBase):
    """Schema for daily expense with entries"""
    id: int
    user_id: int
    driver_name: Optional[str] = Field(None, description="Driver name from user relationship")
    entries: List[DailyExpenseEntry] = Field(default_factory=list, description="List of expense entries")

    class Config:
        from_attributes = True

# Response schema for listing (summary without entries)
class DailyExpenseSummary(BaseModel):
    """Summary view of daily expense without full entries"""
    id: int
    date: date
    vehicle_number: Optional[str]
    total: float
    user_id: int
    driver_name: Optional[str]
    entry_count: int = Field(..., description="Number of expense entries")

    class Config:
        from_attributes = True
