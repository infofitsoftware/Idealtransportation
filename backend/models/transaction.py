from sqlalchemy import Column, String, Date, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    # Work order and payment tracking fields
    work_order_no = Column(String(50), nullable=False)
    collected_amount = Column(Float, nullable=False)
    due_amount = Column(Float, nullable=False)
    bol_id = Column(Integer, ForeignKey("bill_of_lading.id"), nullable=False)
    # Location and payment information (kept from original)
    pickup_location = Column(String, nullable=False)
    dropoff_location = Column(String, nullable=False)
    payment_type = Column(String, nullable=False)  # Cash, Check, Zelle
    comments = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    bill_of_lading = relationship("BillOfLading") 