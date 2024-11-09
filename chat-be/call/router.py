from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from user.dependencies import get_current_user
from user.models import User
from ws.router import manager


router = APIRouter(prefix="/call", tags=["Call"])


