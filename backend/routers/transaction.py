from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from models.transaction import Transaction
from models.daily_expense import DailyExpense
from models.user import User
from models.bill_of_lading import BillOfLading
from schemas.transaction import TransactionCreate, Transaction as TransactionSchema
from schemas.daily_expense import DailyExpenseCreate, DailyExpense as DailyExpenseSchema
from database import get_db
from dependencies import get_current_user
from utils.logger import setup_logger

# Setup logger
logger = setup_logger(__name__, "transaction.log")

router = APIRouter()

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
    try:
        logger.info(f"Fetching daily expenses for user: {current_user.email}")
        logger.info(f"User ID: {current_user.id}")
        
        # Log the query before execution
        query = db.query(DailyExpense).filter(DailyExpense.user_id == current_user.id)
        logger.info(f"SQL Query: {query}")
        
        expenses = query.all()
        logger.info(f"Found {len(expenses)} daily expenses")
        
        # Convert each expense to a dictionary and validate
        result = []
        for expense in expenses:
            try:
                # Convert to dict first
                expense_dict = {
                    "id": expense.id,
                    "date": expense.date,
                    "diesel_amount": float(expense.diesel_amount),
                    "diesel_location": expense.diesel_location,
                    "def_amount": float(expense.def_amount),
                    "def_location": expense.def_location,
                    "other_expense_description": expense.other_expense_description,
                    "other_expense_amount": float(expense.other_expense_amount) if expense.other_expense_amount is not None else None,
                    "other_expense_location": expense.other_expense_location,
                    "total": float(expense.total),
                    "user_id": expense.user_id
                }
                
                # Validate using schema
                validated_expense = DailyExpenseSchema(**expense_dict)
                result.append(validated_expense)
                logger.info(f"Validated expense data: {validated_expense.dict()}")
            except Exception as e:
                logger.error(f"Validation error for expense {expense.id}: {str(e)}")
                if hasattr(e, 'errors'):
                    logger.error(f"Validation error details: {e.errors()}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Validation error for expense {expense.id}: {str(e)}"
                )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_daily_expenses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/daily-expenses/{expense_id}", response_model=DailyExpenseSchema)
def get_daily_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching daily expense for user: {current_user.email}")
    expense = db.query(DailyExpense).filter(
        DailyExpense.id == expense_id,
        DailyExpense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Daily expense not found")
    return expense

# Transaction Endpoints
@router.post("/", response_model=TransactionSchema)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(f"Creating new transaction for user: {current_user.email}")
        logger.debug(f"Transaction data: {transaction.dict()}")
        
        # Validate work order exists
        bol = db.query(BillOfLading).filter(
            BillOfLading.work_order_no == transaction.work_order_no
        ).first()
        
        if not bol:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Work order '{transaction.work_order_no}' not found"
            )
        
        # Calculate total collected amount for this work order
        total_collected = db.query(func.sum(Transaction.collected_amount)).filter(
            Transaction.work_order_no == transaction.work_order_no
        ).scalar() or 0.0
        
        # Calculate due amount
        due_amount = bol.total_amount - total_collected - transaction.collected_amount
        
        # Validate payment doesn't exceed total amount
        if due_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount ${transaction.collected_amount} exceeds remaining due amount ${bol.total_amount - total_collected}"
            )
        
        db_transaction = Transaction(
            date=transaction.date,
            work_order_no=transaction.work_order_no,
            collected_amount=transaction.collected_amount,
            due_amount=due_amount,
            bol_id=bol.id,
            pickup_location=transaction.pickup_location,
            dropoff_location=transaction.dropoff_location,
            payment_type=transaction.payment_type,
            comments=transaction.comments,
            user_id=current_user.id
        )
        
        logger.info("Adding transaction to database")
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        logger.info(f"Transaction created successfully with ID: {db_transaction.id}")
        return db_transaction
        
    except HTTPException:
        raise
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
    
    # Join with BOL to get broker information
    transactions_with_broker = db.query(
        Transaction,
        BillOfLading.broker_name,
        BillOfLading.broker_address,
        BillOfLading.broker_phone
    ).outerjoin(
        BillOfLading, Transaction.bol_id == BillOfLading.id
    ).filter(Transaction.user_id == current_user.id).all()
    
    # Convert to response format
    result = []
    for transaction, broker_name, broker_address, broker_phone in transactions_with_broker:
        transaction_dict = {
            "id": transaction.id,
            "date": transaction.date,
            "work_order_no": transaction.work_order_no,
            "collected_amount": transaction.collected_amount,
            "due_amount": transaction.due_amount,
            "bol_id": transaction.bol_id,
            "pickup_location": transaction.pickup_location,
            "dropoff_location": transaction.dropoff_location,
            "payment_type": transaction.payment_type,
            "comments": transaction.comments,
            "user_id": transaction.user_id,
            "broker_name": broker_name,
            "broker_address": broker_address,
            "broker_phone": broker_phone
        }
        result.append(transaction_dict)
    
    logger.info(f"Found {len(result)} transactions with broker information")
    return result

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

# New Work Order Endpoints
@router.get("/work-orders/pending")
def get_pending_work_orders(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Get BOLs with pending payments for dropdown selection
    """
    # Subquery to get total collected amount for each work order
    collected_amounts = db.query(
        Transaction.work_order_no,
        func.sum(Transaction.collected_amount).label('total_collected')
    ).group_by(Transaction.work_order_no).subquery()
    
    # Query BOLs with pending payments
    pending_bols = db.query(
        BillOfLading.id,
        BillOfLading.work_order_no,
        BillOfLading.driver_name,
        BillOfLading.date,
        BillOfLading.total_amount,
        func.coalesce(collected_amounts.c.total_collected, 0).label('total_collected'),
        (BillOfLading.total_amount - func.coalesce(collected_amounts.c.total_collected, 0)).label('due_amount')
    ).outerjoin(
        collected_amounts, 
        BillOfLading.work_order_no == collected_amounts.c.work_order_no
    ).filter(
        BillOfLading.total_amount > func.coalesce(collected_amounts.c.total_collected, 0)
    ).all()
    
    return [
        {
            "id": bol.id,
            "work_order_no": bol.work_order_no,
            "driver_name": bol.driver_name,
            "date": bol.date,
            "total_amount": bol.total_amount,
            "total_collected": float(bol.total_collected),
            "due_amount": float(bol.due_amount)
        }
        for bol in pending_bols
    ]

@router.get("/work-order/{work_order_no}/status")
def get_work_order_payment_status(work_order_no: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Get payment status for a specific work order
    """
    # Get BOL details
    bol = db.query(BillOfLading).filter(
        BillOfLading.work_order_no == work_order_no
    ).first()
    
    if not bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_order_no}' not found"
        )
    
    # Get total collected amount
    total_collected = db.query(func.sum(Transaction.collected_amount)).filter(
        Transaction.work_order_no == work_order_no
    ).scalar() or 0.0
    
    due_amount = bol.total_amount - total_collected if bol.total_amount else 0.0
    
    return {
        "work_order_no": work_order_no,
        "total_amount": bol.total_amount,
        "total_collected": float(total_collected),
        "due_amount": float(due_amount),
        "is_fully_paid": due_amount <= 0,
        "payment_percentage": (total_collected / bol.total_amount * 100) if bol.total_amount else 0
    }

@router.get("/work-order/{work_order_no}/transactions")
def get_transactions_by_work_order(work_order_no: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Get all transactions for a specific work order
    """
    # Verify work order exists
    bol = db.query(BillOfLading).filter(
        BillOfLading.work_order_no == work_order_no
    ).first()
    
    if not bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work order '{work_order_no}' not found"
        )
    
    # Get all transactions for this work order
    transactions = db.query(Transaction).filter(
        Transaction.work_order_no == work_order_no,
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date).all()
    
    return [
        {
            "id": t.id,
            "date": t.date,
            "collected_amount": t.collected_amount,
            "due_amount": t.due_amount,
            "payment_type": t.payment_type,
            "comments": t.comments
        }
        for t in transactions
    ] 