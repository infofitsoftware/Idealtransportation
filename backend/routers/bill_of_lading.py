from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from schemas.bill_of_lading import BillOfLadingCreate, BillOfLading as BillOfLadingSchema
from models.bill_of_lading import BillOfLading, BOLVehicle
from models.transaction import Transaction
from database import get_db
from typing import List, Dict, Any, Optional
import time
from functools import lru_cache

router = APIRouter()

# Simple in-memory cache for payment data (expires after 5 minutes)
_payment_cache = {}
_cache_expiry = {}

def get_cached_payment_data(work_order_nos: List[str], db: Session) -> Dict[str, float]:
    """Get payment data with simple caching"""
    current_time = time.time()
    cache_key = ",".join(sorted(work_order_nos))
    
    # Check if cache is valid
    if (cache_key in _payment_cache and 
        cache_key in _cache_expiry and 
        current_time < _cache_expiry[cache_key]):
        return _payment_cache[cache_key]
    
    # Fetch fresh data
    if work_order_nos:
        payment_results = db.query(
            Transaction.work_order_no,
            func.sum(Transaction.collected_amount).label('total_collected')
        ).filter(
            Transaction.work_order_no.in_(work_order_nos)
        ).group_by(Transaction.work_order_no).all()
        
        payment_data = {row.work_order_no: float(row.total_collected) for row in payment_results}
    else:
        payment_data = {}
    
    # Cache for 5 minutes
    _payment_cache[cache_key] = payment_data
    _cache_expiry[cache_key] = current_time + 300  # 5 minutes
    
    return payment_data

@router.post("/", status_code=201)
def create_bill_of_lading(bol: BillOfLadingCreate, db: Session = Depends(get_db)):
    # Check if work order number already exists
    if bol.work_order_no:
        existing_bol = db.query(BillOfLading).filter(
            BillOfLading.work_order_no == bol.work_order_no
        ).first()
        if existing_bol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Work order number '{bol.work_order_no}' already exists"
            )
    
    # Calculate total amount from vehicle prices
    total_amount = 0.0
    for vehicle in bol.vehicles:
        try:
            price = float(vehicle.price) if vehicle.price else 0.0
            total_amount += price
        except (ValueError, TypeError):
            # If price is not a valid number, treat as 0
            pass
    
    db_bol = BillOfLading(
        driver_name=bol.driver_name,
        date=bol.date,
        work_order_no=bol.work_order_no,
        # Broker information fields
        broker_name=bol.broker_name,
        broker_address=bol.broker_address,
        broker_phone=bol.broker_phone,
        pickup_name=bol.pickup_name,
        pickup_address=bol.pickup_address,
        pickup_city=bol.pickup_city,
        pickup_state=bol.pickup_state,
        pickup_zip=bol.pickup_zip,
        pickup_phone=bol.pickup_phone,
        delivery_name=bol.delivery_name,
        delivery_address=bol.delivery_address,
        delivery_city=bol.delivery_city,
        delivery_state=bol.delivery_state,
        delivery_zip=bol.delivery_zip,
        delivery_phone=bol.delivery_phone,
        condition_codes=bol.condition_codes,
        remarks=bol.remarks,
        pickup_agent_name=bol.pickup_agent_name,
        pickup_signature=bol.pickup_signature,
        pickup_date=bol.pickup_date,
        delivery_agent_name=bol.delivery_agent_name,
        delivery_signature=bol.delivery_signature,
        delivery_date=bol.delivery_date,
        # New receiver agent fields
        receiver_agent_name=bol.receiver_agent_name,
        receiver_signature=bol.receiver_signature,
        receiver_date=bol.receiver_date,
        # Total amount calculated from vehicles
        total_amount=total_amount,
    )
    db.add(db_bol)
    db.commit()
    db.refresh(db_bol)
    
    # Add vehicles
    for v in bol.vehicles:
        db_vehicle = BOLVehicle(
            bill_of_lading_id=db_bol.id,
            year=v.year,
            make=v.make,
            model=v.model,
            vin=v.vin,
            mileage=v.mileage,
            price=v.price,
        )
        db.add(db_vehicle)
    db.commit()
    return {"id": db_bol.id, "total_amount": total_amount}

@router.get("/", response_model=List[BillOfLadingSchema])
def list_bill_of_lading(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=1000),  # Default 20, max 1000 for exports
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    work_order_no: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None, enum=["all", "paid", "pending"]),
    sort_by: str = Query("date", enum=["date", "work_order_no", "driver_name"]),
    sort_order: str = Query("asc", enum=["asc", "desc"])
):
    start_time = time.time()
    
    # For payment status filtering, we need to use a subquery approach
    if payment_status and payment_status != "all":
        # Create a subquery to get work orders with their payment status
        payment_subquery = db.query(
            Transaction.work_order_no,
            func.sum(Transaction.collected_amount).label('total_collected')
        ).group_by(Transaction.work_order_no).subquery()
        
        # Join with BOLs to get payment information
        query = db.query(BillOfLading).outerjoin(
            payment_subquery, 
            BillOfLading.work_order_no == payment_subquery.c.work_order_no
        )
        
        # Apply payment status filter
        if payment_status == "paid":
            # Fully paid: total_collected >= total_amount
            query = query.filter(
                func.coalesce(payment_subquery.c.total_collected, 0) >= BillOfLading.total_amount
            )
        elif payment_status == "pending":
            # Pending/partial: total_collected < total_amount
            query = query.filter(
                func.coalesce(payment_subquery.c.total_collected, 0) < BillOfLading.total_amount
            )
    else:
        # No payment status filter, use simple query
        query = db.query(BillOfLading)
    
    # Apply other filters
    if from_date:
        query = query.filter(BillOfLading.date >= from_date)
    if to_date:
        query = query.filter(BillOfLading.date <= to_date)
    if work_order_no:
        query = query.filter(BillOfLading.work_order_no.ilike(f"%{work_order_no}%"))
    
    # Apply sorting
    sort_column = getattr(BillOfLading, sort_by, BillOfLading.date)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    bols = query.offset(skip).limit(limit).all()
    
    if not bols:
        return []
    
    # Batch fetch payment data for all work orders at once (with caching)
    work_order_nos = [bol.work_order_no for bol in bols if bol.work_order_no]
    payment_data = get_cached_payment_data(work_order_nos, db)
    
    # Process results efficiently
    for bol in bols:
        total_collected = payment_data.get(bol.work_order_no, 0.0) if bol.work_order_no else 0.0
        total_amount = bol.total_amount or 0.0
        due_amount = max(0.0, total_amount - total_collected)
        
        # Add payment info to the BOL object
        bol.total_collected = total_collected
        bol.due_amount = due_amount
    
    # Log performance metrics
    end_time = time.time()
    query_time = end_time - start_time
    print(f"BOL Query Performance: {query_time:.3f}s for {len(bols)} records (skip={skip}, limit={limit})")
    
    return bols

@router.get("/pending-payments")
def get_bols_with_pending_payments(db: Session = Depends(get_db)):
    """
    Get BOLs that have pending payments (total_amount > collected_amount)
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

@router.get("/{bol_id}", response_model=BillOfLadingSchema)
def get_bill_of_lading(bol_id: int, db: Session = Depends(get_db)):
    """
    Get a specific BOL by ID with payment information
    """
    bol = db.query(BillOfLading).filter(BillOfLading.id == bol_id).first()
    
    if not bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOL with ID {bol_id} not found"
        )
    
    # Get payment information
    if bol.work_order_no:
        total_collected = db.query(func.sum(Transaction.collected_amount)).filter(
            Transaction.work_order_no == bol.work_order_no
        ).scalar() or 0.0
    else:
        total_collected = 0.0
    
    total_amount = bol.total_amount or 0.0
    due_amount = max(0.0, total_amount - total_collected)
    
    # Add payment info to the BOL object
    bol.total_collected = total_collected
    bol.due_amount = due_amount
    
    return bol

@router.put("/{bol_id}", response_model=BillOfLadingSchema)
def update_bill_of_lading(
    bol_id: int, 
    bol_update: BillOfLadingCreate, 
    db: Session = Depends(get_db)
):
    """
    Update an existing BOL
    """
    # Check if BOL exists
    existing_bol = db.query(BillOfLading).filter(BillOfLading.id == bol_id).first()
    if not existing_bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOL with ID {bol_id} not found"
        )
    
    # Check if work order number is being changed and if new one already exists
    if (bol_update.work_order_no and 
        bol_update.work_order_no != existing_bol.work_order_no):
        duplicate_bol = db.query(BillOfLading).filter(
            BillOfLading.work_order_no == bol_update.work_order_no,
            BillOfLading.id != bol_id
        ).first()
        if duplicate_bol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Work order number '{bol_update.work_order_no}' already exists"
            )
    
    # Calculate new total amount from vehicle prices
    total_amount = 0.0
    for vehicle in bol_update.vehicles:
        try:
            price = float(vehicle.price) if vehicle.price else 0.0
            total_amount += price
        except (ValueError, TypeError):
            pass
    
    # Update BOL fields
    for field, value in bol_update.dict().items():
        if field != 'vehicles' and hasattr(existing_bol, field):
            setattr(existing_bol, field, value)
    
    existing_bol.total_amount = total_amount
    
    # Delete existing vehicles and add new ones
    db.query(BOLVehicle).filter(BOLVehicle.bill_of_lading_id == bol_id).delete()
    
    for v in bol_update.vehicles:
        db_vehicle = BOLVehicle(
            bill_of_lading_id=bol_id,
            year=v.year,
            make=v.make,
            model=v.model,
            vin=v.vin,
            mileage=v.mileage,
            price=v.price,
        )
        db.add(db_vehicle)
    
    db.commit()
    db.refresh(existing_bol)
    
    # Add payment information
    if existing_bol.work_order_no:
        total_collected = db.query(func.sum(Transaction.collected_amount)).filter(
            Transaction.work_order_no == existing_bol.work_order_no
        ).scalar() or 0.0
    else:
        total_collected = 0.0
    
    due_amount = max(0.0, total_amount - total_collected)
    existing_bol.total_collected = total_collected
    existing_bol.due_amount = due_amount
    
    return existing_bol

@router.delete("/{bol_id}")
def delete_bill_of_lading(bol_id: int, db: Session = Depends(get_db)):
    """
    Delete a BOL and all associated vehicles
    """
    bol = db.query(BillOfLading).filter(BillOfLading.id == bol_id).first()
    
    if not bol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"BOL with ID {bol_id} not found"
        )
    
    # Check if there are any transactions associated with this BOL
    if bol.work_order_no:
        transaction_count = db.query(Transaction).filter(
            Transaction.work_order_no == bol.work_order_no
        ).count()
        
        if transaction_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete BOL with work order '{bol.work_order_no}' because it has {transaction_count} associated transaction(s). Please delete transactions first."
            )
    
    # Delete associated vehicles first
    db.query(BOLVehicle).filter(BOLVehicle.bill_of_lading_id == bol_id).delete()
    
    # Delete the BOL
    db.delete(bol)
    db.commit()
    
    return {"message": f"BOL {bol_id} deleted successfully"}

@router.get("/work-order/{work_order_no}/payment-status")
def get_payment_status(work_order_no: str, db: Session = Depends(get_db)):
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