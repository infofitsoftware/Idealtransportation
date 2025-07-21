from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.bill_of_lading import BillOfLadingCreate, BillOfLading as BillOfLadingSchema
from models.bill_of_lading import BillOfLading, BOLVehicle
from database import get_db
from typing import List

router = APIRouter()

@router.post("/", status_code=201)
def create_bill_of_lading(bol: BillOfLadingCreate, db: Session = Depends(get_db)):
    db_bol = BillOfLading(
        driver_name=bol.driver_name,
        date=bol.date,
        work_order_no=bol.work_order_no,
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
    return {"id": db_bol.id}

@router.get("/", response_model=List[BillOfLadingSchema])
def list_bill_of_lading(db: Session = Depends(get_db)):
    bol_list = db.query(BillOfLading).all()
    return bol_list 