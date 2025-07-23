from fastapi import FastAPI, Request  # Added Request import here
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import diagnosis  # Import your router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your router
app.include_router(diagnosis.router)

# WebSocket CORS middleware
@app.middleware("http")
async def websocket_cors_middleware(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/ws/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response