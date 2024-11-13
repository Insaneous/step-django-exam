import json
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from user.dependencies import get_current_user


router = APIRouter(prefix="/ws", tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, list[WebSocket]] = dict()

    async def connect(self, chat_id: int, websocket: WebSocket):
        """Accept the WebSocket connection and add it to active connections."""
        await websocket.accept()
        if chat_id in self.active_connections:
            self.active_connections[chat_id].append(websocket)
        else:
            self.active_connections[chat_id] = [websocket]

    async def disconnect(self, chat_id: int, websocket: WebSocket):
        """Remove the WebSocket connection from the active connections."""
        if chat_id in self.active_connections:
            self.active_connections[chat_id].remove(websocket)
            if not self.active_connections[chat_id]:  # If no active connections, delete the chat_id entry.
                del self.active_connections[chat_id]

    async def broadcast(self, chat_id: int, message: dict):
        """Send a message to all active connections in the chat."""
        # Ensure the message is in JSON format
        for connection in self.active_connections.get(chat_id, []):
            await connection.send_text(json.dumps(message))


manager = ConnectionManager()


@router.websocket("/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: int, token: str):
    """WebSocket endpoint to handle connections and message broadcasting."""
    user = await get_current_user(token)
    await manager.connect(chat_id, websocket)
    
    try:
        while True:
            # Receiving data (you can handle the data here if needed)
            data = await websocket.receive_text()
            # Here you can add logic to handle incoming messages if needed
    except WebSocketDisconnect:
        # When a user disconnects, remove them from the active connections
        await manager.disconnect(chat_id, websocket)
        # Broadcast a message when the user leaves
        await manager.broadcast(chat_id, {"message": f"Client #{chat_id} left the chat"})
