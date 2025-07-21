"""add receiver agent fields to bill_of_lading

Revision ID: de4e2d20f6e7
Revises: 1ab18aada64a
Create Date: 2025-07-21 14:29:11.221290

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'de4e2d20f6e7'
down_revision = '1ab18aada64a'
branch_labels = None
depends_on = None


def upgrade():
       op.add_column('bill_of_lading', sa.Column('receiver_agent_name', sa.String(length=100), nullable=True))
       op.add_column('bill_of_lading', sa.Column('receiver_signature', sa.Text(), nullable=True))
       op.add_column('bill_of_lading', sa.Column('receiver_date', sa.Date(), nullable=True))

def downgrade():
    op.drop_column('bill_of_lading', 'receiver_agent_name')
    op.drop_column('bill_of_lading', 'receiver_signature')
    op.drop_column('bill_of_lading', 'receiver_date')