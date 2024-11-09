from typing import Optional
from pydantic import BaseModel


class SCMessage(BaseModel):
    text: str
    file: Optional[str]