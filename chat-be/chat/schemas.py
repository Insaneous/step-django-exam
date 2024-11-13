from typing import Optional
from fastapi import UploadFile
from pydantic import BaseModel


class SCMessage(BaseModel):
    text: str
    file: Optional[UploadFile] = None
    
class SCUser(BaseModel):
    username: str
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True