import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship
from repository.base import Base

class ChatType(enum.Enum):
    GROUP = 'group'
    PERSONAL = 'personal'
    CHANNEL = 'channel'

class Message(Base):
    user_id = Column(ForeignKey("users.id", ondelete="set null"), nullable=True)
    chat_id = Column(ForeignKey("chats.id", ondelete="set null"), nullable=True)
    text = Column(Text, nullable=True)
    file = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
class ChatUser(Base):
    user_id = Column(ForeignKey("users.id", ondelete="set null"), nullable=False)
    chat_id = Column(ForeignKey("chats.id", ondelete="set null"), nullable=False)

class Chat(Base):
    type = Column(Enum(ChatType, native_enum=True))
    name = Column(String(length=255), nullable=True)
    messages = relationship(Message, back_populates="chat_id")