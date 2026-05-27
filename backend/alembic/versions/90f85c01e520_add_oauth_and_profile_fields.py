"""add_oauth_and_profile_fields

Revision ID: 90f85c01e520
Revises: 7e63f243a966
Create Date: 2026-05-27 11:03:57.494547

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '90f85c01e520'
down_revision: Union[str, Sequence[str], None] = '7e63f243a966'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Alter hashed_password to be nullable
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(length=256),
               nullable=True)
               
    # Add OAuth Columns
    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('oauth_provider', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('oauth_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))
    
    # Add Profile Columns
    op.add_column('users', sa.Column('name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('gender', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('region', sa.String(length=50), nullable=True))
    
    # Create Indices
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_oauth_id'), 'users', ['oauth_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop Indices
    op.drop_index(op.f('ix_users_oauth_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    
    # Drop Profile Columns
    op.drop_column('users', 'region')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'age')
    op.drop_column('users', 'name')
    
    # Drop OAuth Columns
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'oauth_provider')
    op.drop_column('users', 'email')
    
    # Alter hashed_password to be non-nullable
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(length=256),
               nullable=False)
