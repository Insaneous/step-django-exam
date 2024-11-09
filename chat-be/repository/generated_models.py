from pydantic import BaseModel

class SLanguage(BaseModel):
    en: str | None
    ru: str | None
