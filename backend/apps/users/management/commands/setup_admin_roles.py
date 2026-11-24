"""
Management command: setup_admin_roles

Creates one staff user for each of the 4 admin roles.
Run once after initial deployment:
    python manage.py setup_admin_roles

Credentials are printed to the console.
"""

from django.core.management.base import BaseCommand
from apps.users.models import User, AdminUser


ROLES = [
    {
        'name': 'Super Admin',
        'mobile': '9000000001',
        'password': 'SuperAdmin@2024',
        'role': 'SUPER_ADMIN',
        'department': 'Kerala Drug Control — Head Office',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'name': 'Data Approver',
        'mobile': '9000000002',
        'password': 'Approver@2024',
        'role': 'APPROVER',
        'department': 'Quality Control Division',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'name': 'Data Uploader',
        'mobile': '9000000003',
        'password': 'Uploader@2024',
        'role': 'UPLOADER',
        'department': 'Data Entry Cell',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'name': 'Department Officer',
        'mobile': '9000000004',
        'password': 'DeptOfficer@2024',
        'role': 'DEPT_OFFICER',
        'department': 'Regulations & Gazette Division',
        'is_staff': True,
        'is_superuser': False,
    },
]


class Command(BaseCommand):
    help = 'Create one admin user per role (Super Admin, Approver, Uploader, Dept Officer)'

    def handle(self, *args, **options):
        self.stdout.write('\n' + '='*60)
        self.stdout.write('  MEDWATCH — Admin Role Setup')
        self.stdout.write('='*60)

        for cfg in ROLES:
            mobile = cfg['mobile']
            existing = User.objects.filter(mobile=mobile).first()

            if existing:
                self.stdout.write(self.style.WARNING(f'  ⚠  {cfg["name"]} already exists ({mobile}) — skipped'))
                continue

            user = User.objects.create_superuser(
                mobile=mobile,
                name=cfg['name'],
                password=cfg['password'],
            ) if cfg['is_superuser'] else User(
                mobile=mobile,
                name=cfg['name'],
                is_staff=cfg['is_staff'],
                is_superuser=False,
            )

            if not cfg['is_superuser']:
                user.set_password(cfg['password'])
                user.save()

            AdminUser.objects.create(
                user=user,
                role=cfg['role'],
                department=cfg['department'],
            )

            self.stdout.write(self.style.SUCCESS(
                f'  ✅  {cfg["name"]}\n'
                f'       Mobile:   {mobile}\n'
                f'       Password: {cfg["password"]}\n'
                f'       Role:     {cfg["role"]}\n'
            ))

        self.stdout.write('='*60)
        self.stdout.write('  Admin panel: http://127.0.0.1:8000/admin')
        self.stdout.write('='*60 + '\n')
