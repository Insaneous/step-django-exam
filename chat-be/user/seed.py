from sqlalchemy import and_

from repository.models import Language
from user.auth import get_hashed_password
from user.models import Role, User, Permission, RolePermission


class Seeder:
    @staticmethod
    async def run():
        print('users seed start')
        await Language.first_or_create(filter=Language.code == 'en', code="en", name="English")
        await Language.first_or_create(filter=Language.code == 'ru', code="ru", name="Русский")

        admin_role = await Role.first_or_create(
            filter=Role.system_name == 'admin',
            names={
                'en': "Administrator",
                'ru': "Администратор",
            }, system_role=True, system_name="admin")
        user_role = await Role.first_or_create(
            filter=Role.system_name == 'user',
            names={
                "en": "User",
                'ru': "Пользователь",
            }, system_role=True, system_name="user")
        permission_all = await Permission.first_or_create(
            filter=Permission.system_name == 'all',
            names={'ru': 'all', 'en': 'all'},
            system_name='all'
        )
        
        await RolePermission.first_or_create(filter=and_(
            RolePermission.role_id == admin_role.id,
            RolePermission.permission_id == permission_all.id
        ), role_id=admin_role.id, permission_id=permission_all.id)
        admin = await User.first_or_create(filter=User.email == 'admin@admin.ins.cx',
                                           role_id=admin_role.id,
                                           email='admin@admin.ins.cx',
                                           username='admin',
                                           hashed_password=get_hashed_password("admin"))
