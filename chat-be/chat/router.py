from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from chat.models import Chat, ChatUser, ChatType, Message
from chat.schemas import SCMessage
from repository.tools import get_list_data
from user.dependencies import get_current_user
from user.models import User
from ws.router import manager
from database import async_session_maker
from sqlalchemy.orm import selectinload


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/")
async def get_chats(user = Depends(get_current_user)):
    return await Chat.get_all(filter=Chat.users.any(User.id == user.id), includes=['users'])


@router.get("/users")
async def get_users(search: str='', page: int = 1, limit: int = 15, user = Depends(get_current_user)):
    return await get_list_data(
        model=User,
        page=page,
        limit=limit,
        filter=or_(User.email.icontains(search), User.username.icontains(search)),
    )
    
    
@router.post('/personal/{user_id}')
async def start_chat(user_id: int, user = Depends(get_current_user)):
    async with async_session_maker() as session:
        chat = Chat(type=ChatType.PERSONAL)
        session.add(chat)
        await session.flush()
        
        current_user = await session.merge(user)
        other_user = await session.get(User, user_id)
                
        session.add_all([
            ChatUser(chat_id=chat.id, user_id=current_user.id),
            ChatUser(chat_id=chat.id, user_id=other_user.id)
        ])
        
        await session.commit()  # Commit first to persist `Chat` and `ChatUser` relations.
        
        # Reload the chat with its users eagerly loaded to avoid lazy loading.
        chat = await session.get(Chat, chat.id, options=[selectinload(Chat.users)])
        
        return chat


@router.get('/messages/{chat_id}')
async def get_messages(chat_id: int, page: int = 1, limit: int = 15, user = Depends(get_current_user)):
    return await get_list_data(
        model=Message,
        page=page,
        limit=limit,
        filter=Message.chat_id == chat_id,
    )


@router.post('/message/{chat_id}')
async def send_message(chat_id: int, data: SCMessage, user = Depends(get_current_user)):
    chat = await Chat.find_by_id_or_fail(model_id=chat_id)
    await ChatUser.find_one_or_fail(filter=and_(ChatUser.chat_id == chat.id, ChatUser.user_id == user.id))
    message = await Message.create(chat_id=chat_id, user_id=user.id, text=data.text)
    await manager.broadcast(chat_id, message)
    return await Chat.find_by_id(model_id=chat.id, includes=['messages'])

  
@router.post('/message/{chat_id}/edit')
async def edit_message(chat_id: int, data: SCMessage, user = Depends(get_current_user)):
    chat = await Chat.find_by_id_or_fail(model_id=chat_id)
    await ChatUser.find_one_or_fail(filter=and_(ChatUser.chat_id == chat.id, ChatUser.user_id == user.id))
    message = await Message.find_by_id_or_fail(model_id=chat.id)
    await Message.update(model_id=message.id, text=data.text)
    await manager.broadcast(chat_id, message)
    return await Chat.find_by_id(model_id=chat.id, includes=['messages'])