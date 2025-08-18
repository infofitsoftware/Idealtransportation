from pydantic import BaseModel
from typing import Optional
from datetime import date

class TransactionBase(BaseModel):
    date: date
    # Work order and payment tracking fields
    work_order_no: str
    collected_amount: float
    due_amount: float
    bol_id: int
    # Location and payment information (kept from original)
    pickup_location: str
    dropoff_location: str
    payment_type: str
    comments: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int
    # Broker information (populated from BOL)
    broker_name: Optional[str] = None
    broker_address: Optional[str] = None
    broker_phone: Optional[str] = None

    class Config:
        from_attributes = True 