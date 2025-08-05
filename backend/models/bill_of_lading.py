from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, DateTime, Float
from sqlalchemy.orm import relationship
from .base import BaseModel

class BillOfLading(BaseModel):
    __tablename__ = 'bill_of_lading'

    driver_name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    work_order_no = Column(String(50), nullable=True)
    pickup_name = Column(String(100), nullable=True)
    pickup_address = Column(String(200), nullable=True)
    pickup_city = Column(String(100), nullable=True)
    pickup_state = Column(String(50), nullable=True)
    pickup_zip = Column(String(20), nullable=True)
    pickup_phone = Column(String(30), nullable=True)
    delivery_name = Column(String(100), nullable=True)
    delivery_address = Column(String(200), nullable=True)
    delivery_city = Column(String(100), nullable=True)
    delivery_state = Column(String(50), nullable=True)
    delivery_zip = Column(String(20), nullable=True)
    delivery_phone = Column(String(30), nullable=True)
    condition_codes = Column(String(200), nullable=True)  # Comma-separated codes
    remarks = Column(Text, nullable=True)
    pickup_agent_name = Column(String(100), nullable=True)
    pickup_signature = Column(Text, nullable=True)  # base64 string
    pickup_date = Column(Date, nullable=True)
    delivery_agent_name = Column(String(100), nullable=True)
    delivery_signature = Column(Text, nullable=True)  # base64 string
    delivery_date = Column(Date, nullable=True)
    # New receiver agent fields
    receiver_agent_name = Column(String(100), nullable=True)
    receiver_signature = Column(Text, nullable=True)
    receiver_date = Column(Date, nullable=True)
    # Total amount field for payment tracking
    total_amount = Column(Float, nullable=True)

    vehicles = relationship('BOLVehicle', back_populates='bill_of_lading', cascade='all, delete-orphan')

class BOLVehicle(BaseModel):
    __tablename__ = 'bol_vehicle'

    bill_of_lading_id = Column(Integer, ForeignKey('bill_of_lading.id'), nullable=False)
    year = Column(String(10), nullable=True)
    make = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    vin = Column(String(50), nullable=True)
    mileage = Column(String(50), nullable=True)
    price = Column(String(50), nullable=True)

    bill_of_lading = relationship('BillOfLading', back_populates='vehicles') 