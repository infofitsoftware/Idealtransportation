"""add bol performance indexes

Revision ID: add_bol_performance_indexes
Revises: refactor_daily_expense
Create Date: 2026-01-24 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_bol_performance_indexes'
down_revision = 'refactor_daily_expense'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Indexes for BillOfLading table
    op.create_index('idx_bill_of_lading_date', 'bill_of_lading', ['date'], if_not_exists=True)
    op.create_index('idx_bill_of_lading_work_order_no', 'bill_of_lading', ['work_order_no'], if_not_exists=True)
    op.create_index('idx_bill_of_lading_driver_name', 'bill_of_lading', ['driver_name'], if_not_exists=True)
    
    # Indexes for Transaction table
    op.create_index('idx_transaction_work_order_no', 'transactions', ['work_order_no'], if_not_exists=True)
    op.create_index('idx_transaction_date', 'transactions', ['date'], if_not_exists=True)
    op.create_index('idx_transaction_bol_id', 'transactions', ['bol_id'], if_not_exists=True)
    op.create_index('idx_transaction_user_id', 'transactions', ['user_id'], if_not_exists=True)
    
    # Composite indexes for common query patterns
    op.create_index('idx_transaction_work_order_collected', 'transactions', ['work_order_no', 'collected_amount'], if_not_exists=True)
    op.create_index('idx_bill_of_lading_date_work_order', 'bill_of_lading', ['date', 'work_order_no'], if_not_exists=True)
    
    # Index for BOLVehicle foreign key (for eager loading)
    op.create_index('idx_bol_vehicle_bill_of_lading_id', 'bol_vehicle', ['bill_of_lading_id'], if_not_exists=True)


def downgrade() -> None:
    op.drop_index('idx_bol_vehicle_bill_of_lading_id', table_name='bol_vehicle')
    op.drop_index('idx_bill_of_lading_date_work_order', table_name='bill_of_lading')
    op.drop_index('idx_transaction_work_order_collected', table_name='transactions')
    op.drop_index('idx_transaction_user_id', table_name='transactions')
    op.drop_index('idx_transaction_bol_id', table_name='transactions')
    op.drop_index('idx_transaction_date', table_name='transactions')
    op.drop_index('idx_transaction_work_order_no', table_name='transactions')
    op.drop_index('idx_bill_of_lading_driver_name', table_name='bill_of_lading')
    op.drop_index('idx_bill_of_lading_work_order_no', table_name='bill_of_lading')
    op.drop_index('idx_bill_of_lading_date', table_name='bill_of_lading')
