from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    car_year = Column(String)
    car_make = Column(String)
    car_model = Column(String)
    car_vin = Column(String)
    pickup_location = Column(String, nullable=False)
    dropoff_location = Column(String, nullable=False)
    payment_type = Column(String, nullable=False)  # Cash, Check, Zelle
    amount = Column(Float, nullable=False)
    comments = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    user = relationship("User", back_populates="transactions") 