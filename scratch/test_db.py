import asyncio
import logging
from app.db import AsyncSessionLocal, engine
from app.models import ChartEntry, Video
from sqlalchemy import select

# Disable SQLAlchemy logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

async def test():
    async with AsyncSessionLocal() as session:
        for t in ['real', 'daily', 'weekly', 'monthly', 'yearly']:
            stmt = select(ChartEntry, Video).join(Video).where(ChartEntry.chart_type == t).order_by(Video.published_at.asc()).limit(3)
            res = await session.execute(stmt)
            print(f'=== oldest for {t} ===')
            for ce, v in res.all():
                print(f'region={ce.region} pos={ce.position} pub={v.published_at} title={v.title[:30]}')

if __name__ == "__main__":
    asyncio.run(test())
