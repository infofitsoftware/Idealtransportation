from pydantic import BaseModel
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
    date: date
    work_order_no: Optional[str]
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
    pickup_date: Optional[date]
    delivery_agent_name: Optional[str]
    delivery_signature: Optional[str]
    delivery_date: Optional[date]
    # New receiver agent fields
    receiver_agent_name: Optional[str]
    receiver_signature: Optional[str]
    receiver_date: Optional[date]
    # Total amount field for payment tracking
    total_amount: Optional[float]

class BillOfLadingCreate(BillOfLadingBase):
    vehicles: List[BOLVehicleBase]

class BillOfLading(BillOfLadingBase):
    id: int
    vehicles: List[BOLVehicle]
    class Config:
        from_attributes = True 