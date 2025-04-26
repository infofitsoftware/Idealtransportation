from pydantic import BaseModel
from typing import Optional
from datetime import date

class TransactionBase(BaseModel):
    date: date
    car_year: str
    car_make: str
    car_model: str
    car_vin: str
    pickup_location: str
    dropoff_location: str
    payment_type: str
    amount: float
    comments: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True 