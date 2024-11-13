import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text, desc, func, select
from sqlalchemy.orm import relationship, aliased, selectinload
from repository.base import Base
from database import async_session_maker
from typing import List, Optional
from sqlalchemy.orm import joinedload


class ChatType(enum.Enum):
    GROUP = 'group'
    PERSONAL = 'personal'
    CHANNEL = 'channel'

class Message(Base):
    user_id = Column(ForeignKey("users.id", ondelete="set null"), nullable=True)
    chat_id = Column(ForeignKey("chats.id", ondelete="set null"), nullable=True)
    chat = relationship('Chat', back_populates="messages")
    text = Column(Text, nullable=True)
    file = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
class ChatUser(Base):
    user_id = Column(ForeignKey("users.id", ondelete="cascade"), nullable=False)
    chat_id = Column(ForeignKey("chats.id", ondelete="cascade"), nullable=False)

class Chat(Base):
    type = Column(Enum(ChatType, native_enum=True))
    name = Column(String(length=255), nullable=True)
    messages = relationship(Message, back_populates="chat")
    users = relationship('User', secondary='chatusers', back_populates='chats')
    
    @classmethod
    async def get_all(cls, user_id: int):
        # Query to fetch chats with users and last message
        query = (
            select(cls)
            .options(
                selectinload(Chat.users),  # Preload chat users
                selectinload(Chat.messages)  # Preload messages
            )
            .join(ChatUser, ChatUser.chat_id == cls.id)
            .where(ChatUser.user_id == user_id)
            .order_by(desc(cls.id))  # Optional: Adjust ordering as needed
        )

        async with async_session_maker() as session:
            result = await session.execute(query)
            chats = result.scalars().unique().all()
            
            # Attach last message data manually
            for chat in chats:
                chat.last_message = (
                    max(chat.messages, key=lambda m: m.created_at) if chat.messages else None
                )
            return chats