from datetime import datetime
from user.models import User
from fastapi import HTTPException, Request, Depends
from jose import jwt, JWTError

from config import settings


def get_token(request: Request = None):
    token = request.cookies.get("access_token")
    if not token:
        token = request.headers.get("Authorization")
        if not token:
            raise HTTPException(status_code=401, detail="Token is not provided")
    return token


async def get_current_user(token: str = Depends(get_token)):
    try:
        payload = jwt.decode(token, settings.KEY, settings.ALGORITHM)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    expire: str = payload.get("exp")
    if (not expire) or (int(expire) < datetime.utcnow().timestamp()):
        raise HTTPException(status_code=401, detail="Token expired")
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token expired")
    user = await User.find_by_id(int(user_id), includes=['role', 'role.permissions'])

    if not user:
        raise HTTPException(status_code=401, detail="Token expired")
    await User.update(model_id=user.id, last_login=datetime.utcnow())

    return user


async def get_admin(
        token,
):
    user = await get_current_user(token)
    if user.role.system_name != 'admin':
        raise HTTPException(status_code=401, detail="Token expired")
    return user


from functools import wraps


def has_perm(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = kwargs['user']
            permissions_list = set(map(lambda x: x.strip(), permission.split(',')))
            user_permission = set(map(lambda x: x.system_name, user.role.permissions))
            if len(user_permission.intersection(permissions_list)) == 0:
                raise HTTPException(status_code=401, detail="Token expired")
            return await func(*args, **kwargs)

        return wrapper

    return decorator


