"""refactor daily expense to flexible structure

Revision ID: refactor_daily_expense
Revises: 895ccc679cdb
Create Date: 2026-01-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'refactor_daily_expense'
down_revision = '895ccc679cdb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new daily_expense_entries table
    op.create_table(
        'daily_expense_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('daily_expense_id', sa.Integer(), nullable=False),
        sa.Column('expense_type', sa.String(), nullable=False),
        sa.Column('sub_type', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('payment_mode', sa.String(), nullable=False),
        sa.Column('receipt_url', sa.Text(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['daily_expense_id'], ['daily_expenses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_expense_entries_id'), 'daily_expense_entries', ['id'], unique=False)
    
    # Add vehicle_number to daily_expenses (nullable for backward compatibility)
    op.add_column('daily_expenses', sa.Column('vehicle_number', sa.String(), nullable=True))
    
    # Migrate existing data: Convert old structure to new structure
    # This will create entries for diesel, def, and other expenses
    connection = op.get_bind()
    
    # Get all existing daily expenses
    result = connection.execute(sa.text("""
        SELECT id, diesel_amount, diesel_location, def_amount, def_location, 
               other_expense_description, other_expense_amount, other_expense_location
        FROM daily_expenses
    """))
    
    for row in result:
        expense_id = row[0]
        
        # Create Diesel entry if amount > 0
        if row[1] and row[1] > 0:
            connection.execute(sa.text("""
                INSERT INTO daily_expense_entries 
                (daily_expense_id, expense_type, sub_type, amount, location, payment_mode, remarks)
                VALUES (:expense_id, 'Fuel', 'Diesel', :amount, :location, 'Cash', 'Migrated from old structure')
            """), {
                'expense_id': expense_id,
                'amount': row[1],
                'location': row[2] or 'Unknown'
            })
        
        # Create DEF entry if amount > 0
        if row[3] and row[3] > 0:
            connection.execute(sa.text("""
                INSERT INTO daily_expense_entries 
                (daily_expense_id, expense_type, sub_type, amount, location, payment_mode, remarks)
                VALUES (:expense_id, 'Fuel', 'DEF', :amount, :location, 'Cash', 'Migrated from old structure')
            """), {
                'expense_id': expense_id,
                'amount': row[3],
                'location': row[4] or 'Unknown'
            })
        
        # Create Other expense entry if amount > 0
        if row[6] and row[6] > 0:
            connection.execute(sa.text("""
                INSERT INTO daily_expense_entries 
                (daily_expense_id, expense_type, sub_type, amount, location, payment_mode, remarks)
                VALUES (:expense_id, 'Misc', NULL, :amount, :location, 'Cash', :description)
            """), {
                'expense_id': expense_id,
                'amount': row[6],
                'location': row[7] or 'Unknown',
                'description': row[5] or 'Migrated from old structure'
            })
    
    # Note: We keep the old columns for now to maintain backward compatibility
    # They can be dropped in a future migration after confirming all data is migrated


def downgrade() -> None:
    # Remove vehicle_number column
    op.drop_column('daily_expenses', 'vehicle_number')
    
    # Drop the new entries table
    op.drop_index(op.f('ix_daily_expense_entries_id'), table_name='daily_expense_entries')
    op.drop_table('daily_expense_entries')
