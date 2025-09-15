from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import date

class BOLVehicleBase(BaseModel):
    year: str
    make: str
    model: str
    vin: str
    mileage: str
    price: str

class BOLVehicle(BOLVehicleBase):
    id: int
    class Config:
        from_attributes = True

class BillOfLadingBase(BaseModel):
    driver_name: str
    date: str  # Accept both string and date, convert to string for response
    work_order_no: Optional[str]
    # Broker information fields
    broker_name: Optional[str]
    broker_address: Optional[str]
    broker_phone: Optional[str]
    pickup_name: Optional[str]
    pickup_address: Optional[str]
    pickup_city: Optional[str]
    pickup_state: Optional[str]
    pickup_zip: Optional[str]
    pickup_phone: Optional[str]
    delivery_name: Optional[str]
    delivery_address: Optional[str]
    delivery_city: Optional[str]
    delivery_state: Optional[str]
    delivery_zip: Optional[str]
    delivery_phone: Optional[str]
    condition_codes: Optional[str]
    remarks: Optional[str]
    pickup_agent_name: Optional[str]
    pickup_signature: Optional[str]
    pickup_date: Optional[str]  # Accept both string and date, convert to string for response
    delivery_agent_name: Optional[str]
    delivery_signature: Optional[str]
    delivery_date: Optional[str]  # Accept both string and date, convert to string for response
    # New receiver agent fields
    receiver_agent_name: Optional[str]
    receiver_signature: Optional[str]
    receiver_date: Optional[str]  # Accept both string and date, convert to string for response
    # Total amount field for payment tracking
    total_amount: Optional[float]

    @validator('date', pre=True)
    def parse_date(cls, v):
        if isinstance(v, date):
            return v.strftime('%Y-%m-%d')  # Convert date to string
        elif isinstance(v, str) and v:
            return v  # Return as string
        return v

    @validator('pickup_date', 'delivery_date', 'receiver_date', pre=True)
    def parse_optional_dates(cls, v):
        if isinstance(v, date):
            return v.strftime('%Y-%m-%d')  # Convert date to string
        elif isinstance(v, str) and v:
            return v  # Return as string
        return v

class BillOfLadingCreate(BillOfLadingBase):
    vehicles: List[BOLVehicleBase]

class BillOfLading(BillOfLadingBase):
    id: int
    vehicles: List[BOLVehicle]
    # Payment tracking fields (calculated from transactions)
    total_collected: Optional[float] = None
    due_amount: Optional[float] = None
    
    class Config:
        from_attributes = True 