"""기타 라우터 (consent 등)"""
import uuid
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db import get_db

router = APIRouter(tags=["Misc"])


class ConsentPayload(BaseModel):
    analytics: bool = False
    advertising: bool = False


@router.post("/api/consent", status_code=204)
async def save_consent(
    payload: ConsentPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """쿠키 동의 저장"""
    session_id_str = request.cookies.get("sid") or str(uuid.uuid4())
    try:
        session_id = uuid.UUID(session_id_str)
    except ValueError:
        session_id = uuid.uuid4()

    raw_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(raw_ip.encode()).hexdigest()
    user_agent = request.headers.get("user-agent")
    secret_key = b"shorts100_consent_secret_key_fallback"

    for consent_type, granted in [("analytics", payload.analytics), ("advertising", payload.advertising)]:
        msg = f"{session_id}:{consent_type}:{granted}".encode()
        signature = hmac.new(secret_key, msg, hashlib.sha256).hexdigest()
        await db.execute(
            text(
                "INSERT INTO consent_log "
                "(session_id, consent_type, granted, user_agent, ip_hash, signature, signed_at) "
                "VALUES (:sid, :ct, :gr, :ua, :ip, :sig, :now)"
            ),
            {"sid": session_id, "ct": consent_type, "gr": granted,
             "ua": user_agent, "ip": ip_hash, "sig": signature,
             "now": datetime.now(timezone.utc)},
        )
    await db.commit()
