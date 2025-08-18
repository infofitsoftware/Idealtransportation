from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from schemas.bill_of_lading import BillOfLadingCreate, BillOfLading as BillOfLadingSchema
from models.bill_of_lading import BillOfLading, BOLVehicle
from models.transaction import Transaction
from database import get_db
from typing import List, Dict, Any

router = APIRouter()

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
def list_bill_of_lading(db: Session = Depends(get_db)):
    # Get all BOLs with payment information
    bol_list = db.query(BillOfLading).all()
    
    # For each BOL, calculate payment information
    for bol in bol_list:
        if bol.work_order_no:
            # Get total collected amount for this work order
            total_collected = db.query(func.coalesce(func.sum(Transaction.collected_amount), 0)).filter(
                Transaction.work_order_no == bol.work_order_no
            ).scalar()
            
            # Calculate due amount
            total_amount = bol.total_amount or 0.0
            due_amount = max(0.0, total_amount - total_collected)
            
            # Add payment info to the BOL object (these will be included in the response)
            bol.total_collected = total_collected
            bol.due_amount = due_amount
        else:
            # If no work order number, set payment info to 0
            bol.total_collected = 0.0
            bol.due_amount = bol.total_amount or 0.0
    
    return bol_list

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