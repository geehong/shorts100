from fastapi import FastAPI

app = FastAPI(
    title="Shorts100 API",
    description="YouTube Shorts Trending API",
    version="0.1.0"
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "shorts100-backend"}