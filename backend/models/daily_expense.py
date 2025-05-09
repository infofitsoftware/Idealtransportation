from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class DailyExpense(Base):
    __tablename__ = "daily_expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    diesel_amount = Column(Float, nullable=False)
    diesel_location = Column(String, nullable=False)
    def_amount = Column(Float, nullable=False)
    def_location = Column(String, nullable=False)
    other_expense_description = Column(String)
    other_expense_amount = Column(Float)
    other_expense_location = Column(String)
    total = Column(Float, nullable=False)
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="daily_expenses") 