from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional
from datetime import datetime, timedelta
from database import get_db
from dependencies import get_current_user, get_current_admin_user
from models.user import User
from models.bill_of_lading import BillOfLading
from models.transaction import Transaction

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard statistics based on user role.
    - Admin: Returns company-wide statistics
    - Driver: Returns only their own statistics
    """
    is_admin = current_user.is_superuser
    
    if is_admin:
        # Admin: Company-wide statistics
        return await get_admin_stats(db)
    else:
        # Driver: Personal statistics only
        return await get_driver_stats(db, current_user.id)

async def get_admin_stats(db: Session):
    """Get company-wide statistics for admin"""
    
    # Total BOLs
    total_bols = db.query(func.count(BillOfLading.id)).scalar() or 0
    
    # Total revenue (sum of all BOL total_amount)
    total_revenue = db.query(func.coalesce(func.sum(BillOfLading.total_amount), 0)).scalar() or 0.0
    
    # Total collected (sum of all transaction collected_amount)
    total_collected = db.query(func.coalesce(func.sum(Transaction.collected_amount), 0)).scalar() or 0.0
    
    # Total pending (total_revenue - total_collected)
    total_pending = max(0.0, total_revenue - total_collected)
    
    # Active drivers (users who have created BOLs)
    active_drivers = db.query(func.count(func.distinct(BillOfLading.driver_name))).scalar() or 0
    
    # Recent BOLs (last 5)
    recent_bols = db.query(BillOfLading).order_by(BillOfLading.date.desc(), BillOfLading.id.desc()).limit(5).all()
    
    # Payment status breakdown
    # Get all BOLs with their payment status
    bols_with_payments = db.query(
        BillOfLading.id,
        BillOfLading.total_amount,
        func.coalesce(func.sum(Transaction.collected_amount), 0).label('collected')
    ).outerjoin(
        Transaction, BillOfLading.work_order_no == Transaction.work_order_no
    ).group_by(BillOfLading.id, BillOfLading.total_amount).all()
    
    fully_paid = 0
    partially_paid = 0
    pending_payment = 0
    
    for bol_id, total_amount, collected in bols_with_payments:
        total_amount = total_amount or 0.0
        collected = collected or 0.0
        due = total_amount - collected
        
        if due <= 0:
            fully_paid += 1
        elif collected > 0:
            partially_paid += 1
        else:
            pending_payment += 1
    
    # Recent activity (last 10 BOLs created)
    recent_activity = db.query(BillOfLading).order_by(
        BillOfLading.created_at.desc()
    ).limit(10).all()
    
    # Monthly revenue (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    monthly_revenue = db.query(
        func.date_trunc('month', BillOfLading.date).label('month'),
        func.coalesce(func.sum(BillOfLading.total_amount), 0).label('revenue')
    ).filter(
        BillOfLading.date >= six_months_ago
    ).group_by(
        func.date_trunc('month', BillOfLading.date)
    ).order_by(
        func.date_trunc('month', BillOfLading.date).desc()
    ).limit(6).all()
    
    # Format recent BOLs
    recent_bols_data = []
    for bol in recent_bols:
        # Get payment info for each BOL
        if bol.work_order_no:
            collected = db.query(func.coalesce(func.sum(Transaction.collected_amount), 0)).filter(
                Transaction.work_order_no == bol.work_order_no
            ).scalar() or 0.0
        else:
            collected = 0.0
        
        total_amount = bol.total_amount or 0.0
        due = max(0.0, total_amount - collected)
        
        recent_bols_data.append({
            "id": bol.id,
            "work_order_no": bol.work_order_no,
            "driver_name": bol.driver_name,
            "date": bol.date.isoformat() if bol.date else None,
            "total_amount": total_amount,
            "collected": collected,
            "due": due,
            "status": "paid" if due <= 0 else ("partial" if collected > 0 else "pending")
        })
    
    # Format monthly revenue
    monthly_revenue_data = [
        {
            "month": row.month.strftime("%Y-%m") if row.month else None,
            "revenue": float(row.revenue)
        }
        for row in monthly_revenue
    ]
    
    return {
        "role": "admin",
        "stats": {
            "total_bols": total_bols,
            "total_revenue": float(total_revenue),
            "total_collected": float(total_collected),
            "total_pending": float(total_pending),
            "active_drivers": active_drivers,
            "payment_breakdown": {
                "fully_paid": fully_paid,
                "partially_paid": partially_paid,
                "pending_payment": pending_payment
            }
        },
        "recent_bols": recent_bols_data,
        "monthly_revenue": monthly_revenue_data,
        "recent_activity": [
            {
                "id": bol.id,
                "work_order_no": bol.work_order_no,
                "driver_name": bol.driver_name,
                "date": bol.date.isoformat() if bol.date else None,
                "created_at": bol.created_at.isoformat() if hasattr(bol, 'created_at') and bol.created_at else None
            }
            for bol in recent_activity
        ]
    }

async def get_driver_stats(db: Session, user_id: int):
    """Get personal statistics for driver"""
    
    # Get user's full name to match with BOL driver_name
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    driver_name = user.full_name
    
    # Total BOLs created by this driver
    total_bols = db.query(func.count(BillOfLading.id)).filter(
        BillOfLading.driver_name == driver_name
    ).scalar() or 0
    
    # Total revenue from driver's BOLs
    total_revenue = db.query(func.coalesce(func.sum(BillOfLading.total_amount), 0)).filter(
        BillOfLading.driver_name == driver_name
    ).scalar() or 0.0
    
    # Total collected for driver's work orders
    driver_work_orders = [bol.work_order_no for bol in db.query(BillOfLading.work_order_no).filter(
        BillOfLading.driver_name == driver_name,
        BillOfLading.work_order_no.isnot(None)
    ).all() if bol.work_order_no]
    
    if driver_work_orders:
        total_collected = db.query(func.coalesce(func.sum(Transaction.collected_amount), 0)).filter(
            Transaction.work_order_no.in_(driver_work_orders)
        ).scalar() or 0.0
    else:
        total_collected = 0.0
    
    # Total pending
    total_pending = max(0.0, total_revenue - total_collected)
    
    # Recent BOLs (last 5) created by this driver
    recent_bols = db.query(BillOfLading).filter(
        BillOfLading.driver_name == driver_name
    ).order_by(BillOfLading.date.desc(), BillOfLading.id.desc()).limit(5).all()
    
    # Payment status breakdown for driver's BOLs
    driver_bols = db.query(BillOfLading.id, BillOfLading.work_order_no, BillOfLading.total_amount).filter(
        BillOfLading.driver_name == driver_name
    ).all()
    
    fully_paid = 0
    partially_paid = 0
    pending_payment = 0
    
    for bol_id, work_order_no, total_amount in driver_bols:
        if work_order_no:
            collected = db.query(func.coalesce(func.sum(Transaction.collected_amount), 0)).filter(
                Transaction.work_order_no == work_order_no
            ).scalar() or 0.0
        else:
            collected = 0.0
        
        total_amount = total_amount or 0.0
        due = total_amount - collected
        
        if due <= 0:
            fully_paid += 1
        elif collected > 0:
            partially_paid += 1
        else:
            pending_payment += 1
    
    # Format recent BOLs
    recent_bols_data = []
    for bol in recent_bols:
        # Get payment info for each BOL
        if bol.work_order_no:
            collected = db.query(func.coalesce(func.sum(Transaction.collected_amount), 0)).filter(
                Transaction.work_order_no == bol.work_order_no
            ).scalar() or 0.0
        else:
            collected = 0.0
        
        total_amount = bol.total_amount or 0.0
        due = max(0.0, total_amount - collected)
        
        recent_bols_data.append({
            "id": bol.id,
            "work_order_no": bol.work_order_no,
            "driver_name": bol.driver_name,
            "date": bol.date.isoformat() if bol.date else None,
            "total_amount": total_amount,
            "collected": collected,
            "due": due,
            "status": "paid" if due <= 0 else ("partial" if collected > 0 else "pending")
        })
    
    return {
        "role": "driver",
        "stats": {
            "total_bols": total_bols,
            "total_revenue": float(total_revenue),
            "total_collected": float(total_collected),
            "total_pending": float(total_pending),
            "payment_breakdown": {
                "fully_paid": fully_paid,
                "partially_paid": partially_paid,
                "pending_payment": pending_payment
            }
        },
        "recent_bols": recent_bols_data,
        "recent_activity": [
            {
                "id": bol.id,
                "work_order_no": bol.work_order_no,
                "driver_name": bol.driver_name,
                "date": bol.date.isoformat() if bol.date else None,
                "created_at": bol.created_at.isoformat() if hasattr(bol, 'created_at') and bol.created_at else None
            }
            for bol in recent_bols
        ]
    }
