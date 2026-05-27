"""add_download_and_search_logs

Revision ID: 1b44494a4038
Revises: 90f85c01e520
Create Date: 2026-05-27 12:29:18.242930

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b44494a4038'
down_revision: Union[str, Sequence[str], None] = '90f85c01e520'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('download_request_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('guest_ip', sa.String(length=45), nullable=True),
    sa.Column('guest_session_id', sa.String(length=64), nullable=True),
    sa.Column('url', sa.String(length=2048), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('error_detail', sa.String(length=1024), nullable=True),
    sa.Column('file_token', sa.String(length=128), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_download_request_logs_guest_ip'), 'download_request_logs', ['guest_ip'], unique=False)
    op.create_index(op.f('ix_download_request_logs_guest_session_id'), 'download_request_logs', ['guest_session_id'], unique=False)
    
    op.create_table('search_query_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('guest_ip', sa.String(length=45), nullable=True),
    sa.Column('guest_session_id', sa.String(length=64), nullable=True),
    sa.Column('query', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_search_query_logs_guest_ip'), 'search_query_logs', ['guest_ip'], unique=False)
    op.create_index(op.f('ix_search_query_logs_guest_session_id'), 'search_query_logs', ['guest_session_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_search_query_logs_guest_session_id'), table_name='search_query_logs')
    op.drop_index(op.f('ix_search_query_logs_guest_ip'), table_name='search_query_logs')
    op.drop_table('search_query_logs')
    op.drop_index(op.f('ix_download_request_logs_guest_session_id'), table_name='download_request_logs')
    op.drop_index(op.f('ix_download_request_logs_guest_ip'), table_name='download_request_logs')
    op.drop_table('download_request_logs')
