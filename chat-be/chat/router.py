import os
from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import and_, or_, select
from chat.models import Chat, ChatUser, ChatType, Message
from chat.schemas import SCMessage, SCUser
from repository.tools import get_list_data
from user.dependencies import get_current_user
from user.models import User
from ws.router import manager
from database import async_session_maker
from sqlalchemy.orm import selectinload


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post('/create-or-get')
async def create_or_get_personal_chat(username: str = Body(...), user=Depends(get_current_user)):
    async with async_session_maker() as session:
        # Fetch the other user by username
        other_user = await session.execute(select(User).where(User.username == username))
        other_user = other_user.scalars().first()

        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if a personal chat already exists between the two users
        existing_chat = await session.execute(
            select(Chat)
            .options(selectinload(Chat.users))
            .filter(
                Chat.type == ChatType.PERSONAL,
                Chat.users.any(User.id == user.id),
                Chat.users.any(User.id == other_user.id),
            )
        )
        chat = existing_chat.scalars().first()

        if chat:
            return {
                "id": chat.id,
                "name": chat.name or other_user.username,
                "type": chat.type,
                "users": [user.username for user in chat.users]
            }

        # Create a new personal chat if it doesn't exist
        new_chat = Chat(type=ChatType.PERSONAL)
        session.add(new_chat)
        await session.flush()

        session.add_all([
            ChatUser(chat_id=new_chat.id, user_id=user.id),
            ChatUser(chat_id=new_chat.id, user_id=other_user.id),
        ])

        await session.commit()

        return {
            "id": new_chat.id,
            "name": other_user.username,
            "type": new_chat.type,
            "users": [user.username, other_user.username],
        }


@router.get("/")
async def get_chats(user=Depends(get_current_user)):
    """Retrieve all chats for the current user."""
    try:
        chats = await Chat.get_all(user_id=user.id)
        return [
            {
                "id": chat.id,
                "name": chat.name,
                "type": chat.type,
                "users": [SCUser.model_validate(u) for u in chat.users],
                "last_message": chat.last_message.text if chat.last_message else None
            }
            for chat in chats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/personal/{user_id}')
async def start_chat(user_id: int, user=Depends(get_current_user)):
    """Start a new personal chat between the current user and another user."""
    async with async_session_maker() as session:
        existing_chat = await Chat.find_one(
            filter=and_(
                Chat.type == ChatType.PERSONAL,
                Chat.users.any(id=user_id),
                Chat.users.any(id=user.id)
            )
        )
        if existing_chat:
            return existing_chat

        chat = Chat(type=ChatType.PERSONAL)
        session.add(chat)
        await session.flush()

        current_user = await session.merge(user)
        other_user = await session.get(User, user_id)

        session.add_all([
            ChatUser(chat_id=chat.id, user_id=current_user.id),
            ChatUser(chat_id=chat.id, user_id=other_user.id)
        ])

        await session.commit()
        chat = await session.get(Chat, chat.id, options=[selectinload(Chat.users)])
        return chat


@router.get('/messages/{chat_id}')
async def get_messages(chat_id: int, page: int = 1, limit: int = 15, user=Depends(get_current_user)):
    """Retrieve a paginated list of messages for a specific chat."""
    return {"data": await Message.get_all(filter=Message.chat_id == chat_id),
    'id': chat_id
    }


@router.post('/message/{chat_id}')
async def send_message(chat_id: int, data: SCMessage = Form(), user=Depends(get_current_user)):
    chat = await Chat.find_by_id_or_fail(model_id=chat_id)
    await ChatUser.find_one_or_fail(
        filter=and_(ChatUser.chat_id == chat.id, ChatUser.user_id == user.id)
    )

    file_url = None
    if data.file:
        file_path = f"media/uploads/{data.file.filename}"
        with open(file_path, "wb") as f:
            f.write(await data.file.read())
        file_url = file_path

    message = await Message.create(chat_id=chat_id, user_id=user.id, text=data.text, file=file_url)

    await manager.broadcast(chat_id, message.id)

    return await Chat.find_by_id(model_id=chat.id, includes=["messages"])



@router.get('/message/{message_id}')
async def get_message(message_id: int, user=Depends(get_current_user)):
    async with async_session_maker() as session:
        result = await session.execute(
            select(User).options(selectinload(User.chats)).where(User.id == user.id)
        )
        user_instance = result.scalars().one_or_none()
        
        if not user_instance:
            raise HTTPException(status_code=404, detail="User not found")

        message = await Message.find_by_id_or_fail(model_id=message_id)

        if message.chat_id not in [chat.id for chat in user_instance.chats]:
            raise HTTPException(status_code=403, detail="Not authorized to view this message")
        
        return message


@router.post('/message/{chat_id}/edit')
async def edit_message(chat_id: int, data: SCMessage, user=Depends(get_current_user)):
    """Edit an existing message in a chat and broadcast the changes."""
    chat = await Chat.find_by_id_or_fail(model_id=chat_id)
    await ChatUser.find_one_or_fail(
        filter=and_(ChatUser.chat_id == chat.id, ChatUser.user_id == user.id)
    )

    message = await Message.find_by_id_or_fail(model_id=data.id)
    if message.user_id != user.id:
        raise HTTPException(status_code=403, detail="Cannot edit other users' messages")

    message.text = data.text
    await message.save()

    await manager.broadcast(chat_id, {
        "id": message.id,
        "text": message.text,
        "sender": message.user.username,
        "timestamp": message.created_at.isoformat(),
    })

    return await Chat.find_by_id(model_id=chat.id, includes=["messages"])
