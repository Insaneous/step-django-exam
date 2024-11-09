from pydantic import create_model

from repository.base import Base
from database import async_session_maker
from sqlalchemy import Column, String, insert
from sqlalchemy.orm import Mapped


class Language(Base):
    code = Column(String(length=255), nullable=False)
    name = Column(String(length=255), nullable=False)

    @classmethod
    async def create(cls, includes:list, **data):
        async with async_session_maker() as session:
            query = insert(cls).values(**data)
            res = await session.execute(query)
            await session.commit()
            DynamicModel = await get_dynamic_model()
            with open("repository/generated_models.py", "w") as f:
                f.write("from pydantic import BaseModel\n\n")
                f.write(f"class S{cls.__name__}(BaseModel):\n")
                for field_name, field_type in DynamicModel.__annotations__.items():
                    f.write(f"    {field_name}: {field_type.__name__} | None\n")
            return res.lastrowid


async def get_dynamic_model():
    attributes = await Language.get_all()
    fields = {}

    for attribute in attributes:
        fields[attribute.code] = (str, ...)

    DynamicModel = create_model('DynamicModel', **fields)
    return DynamicModel
