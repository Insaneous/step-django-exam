import os
import shutil

from secrets import token_hex
from typing import List

from slugify import slugify
from repository.tools import get_list_data
from user.auth import (
    get_hashed_password,
    verify_password,
    authenticate_user,
    create_access_token,
)
from user.dependencies import get_current_user
from user.models import User, Role
from user.schemas import SUserAuth, SCurrentUser, SUserRegister, SPUserAuth, SUUser
from fastapi import APIRouter, HTTPException, Response, Depends, UploadFile, Form

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register_user(user_data: SUserRegister, response: Response):
    existing_user = await User.find_one_or_none(User.email == user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed_password = get_hashed_password(user_data.password)
    role = await Role.find_one_or_fail(Role.system_name == 'user')
    user = await User.create(email=user_data.email, username=user_data.username,
                             hashed_password=hashed_password, role_id=role.id,
                             includes=['role', 'role.permissions'])
    access_token = create_access_token({"sub": str(user.id)})
    response.set_cookie("access_token", access_token, httponly=True)
    return {"status": 201, "detail": "register is successful", 'access_token': access_token, 'user': user}


@router.post("/login")
async def login(response: Response, user_data: SUserAuth):
    user = await authenticate_user(user_data.email_or_username, user_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token({"sub": str(user.id)})
    response.set_cookie("access_token", access_token, httponly=True)

    return {'access_token': access_token, 'data': user}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"detail": "success"}


@router.get("/current-user")
async def current_user(user: User = Depends(get_current_user)):
    return user


@router.post('/change-password')
async def change_password(user: User = Depends(get_current_user), new_password: str = Form()):
    hashed_password = get_hashed_password(new_password)
    await User.update(model_id=user.id, hashed_password=hashed_password)
    return {"detail": "change_password", 'status': 200}


@router.patch('/user')
async def update_user(
        name: str = None,lastname: str = None, patronymic:str=None, avatar: UploadFile = None, user: User = Depends(get_current_user)):
    file_name = token_hex(16)
    if avatar is not None:
        try:
            os.remove(path=f"{user.photo}")
        except Exception as e:
            print(e)
        folders = f"media/users/{slugify(user.email)}/"
        path = f"{folders}{file_name}.webp"
        os.makedirs(os.path.dirname(folders), exist_ok=True)
        with open(path, "wb+") as file_object:
            shutil.copyfileobj(avatar.file, file_object)
            await User.update(model_id=user.id, photo=path, name=name, lastname=lastname, patronymic=patronymic)
    else:
        await User.update(model_id=user.id, name=name, lastname=lastname, patronymic=patronymic)
    return {"detail": "changed user data", 'status': 200}


