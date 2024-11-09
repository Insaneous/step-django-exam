import json
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from user.dependencies import get_current_user


router = APIRouter(prefix="/ws", tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, list[WebSocket]] = dict()

    async def connect(self, chat_id, websocket: WebSocket):
        await websocket.accept()
        if self.active_connections.get(chat_id):
            self.active_connections[chat_id].append(websocket)
        else:
            self.active_connections[chat_id] = [websocket]

    def disconnect(self, chat_id, websocket: WebSocket):
        self.active_connections[chat_id].remove(websocket)

    # async def send_personal_message(self, message: str, websocket: WebSocket):
    #     await websocket.send_text(message)

    async def broadcast(self, chat_id, message):
        for connection in self.active_connections[chat_id]:
            await connection.send_text(json.dumps(message))


manager = ConnectionManager()


@router.websocket("/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: int, token: str):
    user = await get_current_user(token)
    await manager.connect(chat_id,websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(chat_id, websocket)
        await manager.broadcast(f"Client #{chat_id} left the chat")