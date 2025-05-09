from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from models.transaction import Transaction
from models.daily_expense import DailyExpense
from models.user import User
from schemas.transaction import TransactionCreate, Transaction as TransactionSchema
from schemas.daily_expense import DailyExpenseCreate, DailyExpense as DailyExpenseSchema
from database import get_db
from dependencies import get_current_user
from utils.logger import setup_logger

# Setup logger
logger = setup_logger(__name__, "transaction.log")

router = APIRouter()

@router.post("/", response_model=TransactionSchema)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"Creating new transaction for user: {current_user.email}")
        logger.debug(f"Transaction data: {transaction.dict()}")
        
        # Convert amount to float explicitly
        amount = float(transaction.amount)
        
        db_transaction = Transaction(
            date=transaction.date,
            car_year=transaction.car_year,
            car_make=transaction.car_make,
            car_model=transaction.car_model,
            car_vin=transaction.car_vin,
            pickup_location=transaction.pickup_location,
            dropoff_location=transaction.dropoff_location,
            payment_type=transaction.payment_type,
            amount=amount,
            comments=transaction.comments,
            user_id=current_user.id
        )
        
        logger.info("Adding transaction to database")
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        logger.info(f"Transaction created successfully with ID: {db_transaction.id}")
        return db_transaction
        
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating transaction"
        )

@router.get("/", response_model=List[TransactionSchema])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Fetching transactions for user: {current_user.email}")
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    logger.info(f"Found {len(transactions)} transactions")
    return transactions

@router.get("/{transaction_id}", response_model=TransactionSchema)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: int,
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    for key, value in transaction.dict().items():
        setattr(db_transaction, key, value)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

# Daily Expense Endpoints
@router.post("/daily-expenses", response_model=DailyExpenseSchema)
def create_daily_expense(
    expense: DailyExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        logger.info(f"Creating new daily expense for user: {current_user.email}")
        
        db_expense = DailyExpense(
            date=expense.date,
            diesel_amount=expense.diesel_amount,
            diesel_location=expense.diesel_location,
            def_amount=expense.def_amount,
            def_location=expense.def_location,
            other_expense_description=expense.other_expense_description,
            other_expense_amount=expense.other_expense_amount,
            other_expense_location=expense.other_expense_location,
            total=expense.total,
            user_id=current_user.id
        )
        
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        
        logger.info(f"Daily expense created successfully with ID: {db_expense.id}")
        return db_expense
        
    except Exception as e:
        logger.error(f"Error creating daily expense: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating daily expense"
        )

@router.get("/daily-expenses", response_model=List[DailyExpenseSchema])
def get_daily_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching daily expenses for user: {current_user.email}")
    expenses = db.query(DailyExpense).filter(DailyExpense.user_id == current_user.id).all()
    logger.info(f"Found {len(expenses)} daily expenses")
    return expenses

@router.get("/daily-expenses/{expense_id}", response_model=DailyExpenseSchema)
def get_daily_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(DailyExpense).filter(
        DailyExpense.id == expense_id,
        DailyExpense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Daily expense not found")
    return expense 