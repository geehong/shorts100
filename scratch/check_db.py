from app.db.session import SyncSession
from app.models import ChartEntry
from sqlalchemy import select, func

with SyncSession() as session:
    # 1. Print current weekly/monthly/yearly snapshot info
    for ct in ["weekly", "monthly", "yearly"]:
        r = session.execute(
            select(ChartEntry.period_key, ChartEntry.created_at, func.count(ChartEntry.id))
            .where(ChartEntry.chart_type == ct)
            .group_by(ChartEntry.period_key, ChartEntry.created_at)
            .order_by(ChartEntry.created_at.desc())
            .limit(3)
        ).all()
        print(f"\n[{ct} chart info in DB]")
        for row in r:
            print(f"Period Key: {row[0]}, Created At: {row[1]}, Count: {row[2]}")
