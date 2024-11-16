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


@router.get("/")
async def get_chats(user=Depends(get_current_user)):
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


@router.post('/personal/{username}')
async def start_chat(username: str, user=Depends(get_current_user)):
    async with async_session_maker() as session:
        other_user = await session.get(User, username=username)
        existing_chat = await Chat.find_one(
            filter=and_(
                Chat.type == ChatType.PERSONAL,
                Chat.users.any(id=other_user.id),
                Chat.users.any(id=user.id)
            )
        )
        if existing_chat:
            return existing_chat

        chat = Chat(type=ChatType.PERSONAL)
        session.add(chat)
        await session.flush()

        current_user = await session.merge(user)

        session.add_all([
            ChatUser(chat_id=chat.id, user_id=current_user.id),
            ChatUser(chat_id=chat.id, user_id=other_user.id)
        ])

        await session.commit()
        chat = await session.get(Chat, chat.id, options=[selectinload(Chat.users)])
        return chat


@router.get('/messages/{chat_id}')
async def get_messages(chat_id: int, page: int = 1, limit: int = 15, user=Depends(get_current_user)):
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
        "id": message.id
    })

    return await Chat.find_by_id(model_id=chat.id, includes=["messages"])
