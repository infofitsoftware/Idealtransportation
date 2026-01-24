from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .base import Base

class DailyExpense(Base):
    """
    Header/Summary table for daily expenses.
    Contains common fields like date, user, vehicle number, and total.
    """
    __tablename__ = "daily_expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    vehicle_number = Column(String, nullable=True)  # Optional vehicle identifier
    total = Column(Float, nullable=False, default=0.0)
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="daily_expenses")
    
    # Relationship to expense entries
    entries = relationship("DailyExpenseEntry", back_populates="daily_expense", cascade="all, delete-orphan")


class DailyExpenseEntry(Base):
    """
    Individual expense entries (rows) for a daily expense.
    Flexible structure allowing any expense type.
    """
    __tablename__ = "daily_expense_entries"

    id = Column(Integer, primary_key=True, index=True)
    daily_expense_id = Column(Integer, ForeignKey("daily_expenses.id", ondelete="CASCADE"), nullable=False)
    
    # Expense details
    expense_type = Column(String, nullable=False)  # Fuel, Toll, Food, Parking, Maintenance, Phone, Misc
    sub_type = Column(String, nullable=True)  # Conditional: Diesel, Petrol, CNG for Fuel; etc.
    amount = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    payment_mode = Column(String, nullable=False)  # Cash, UPI, Card, Company Wallet, Bank Transfer, Zelle
    receipt_url = Column(Text, nullable=True)  # URL or path to receipt image/file
    remarks = Column(Text, nullable=True)
    
    # Relationship back to parent
    daily_expense = relationship("DailyExpense", back_populates="entries")
