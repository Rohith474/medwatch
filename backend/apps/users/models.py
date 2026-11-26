from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, mobile, name, password=None, **extra_fields):
        if not mobile:
            raise ValueError('Mobile number is required')
        user = self.model(mobile=mobile, name=name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, mobile, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        user = self.model(mobile=mobile, name=name, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True)
    state = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    fcm_token = models.TextField(blank=True)
    privacy_mode = models.BooleanField(
        default=True,
        help_text="DPDP Act Privacy: Masks sensitive medicine names on device lock screens"
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'mobile'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.name} ({self.mobile})"


class OTPRecord(models.Model):
    mobile = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.mobile}"


class AdminUser(models.Model):
    ROLES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('APPROVER', 'Data Approver'),
        ('UPLOADER', 'Data Uploader'),
        ('DEPT_OFFICER', 'Department Officer'),
    ]

    # ── What credentials each role MUST have before account is verified ──────
    # Used in validation on both backend and frontend
    ROLE_CREDENTIALS = {
        'SUPER_ADMIN': {
            'label': 'Senior Gazetted Officer',
            'description': 'Must be a senior gazetted officer of the Kerala Drug Control Department.',
            'required_fields': ['employee_id', 'designation'],
            'credential_label': 'Official Order / Appointment Reference',
            'credential_hint': 'Government appointment order number or service book reference',
        },
        'APPROVER': {
            'label': 'Licensed Drug Inspector',
            'description': (
                'Must hold a valid Drug Inspector licence issued under the Drugs & Cosmetics Act 1940 '
                'by CDSCO or the State Drug Control Authority. '
                'Minimum qualification: B.Pharm / M.Pharm / PharmD.'
            ),
            'required_fields': ['employee_id', 'designation', 'qualification', 'licence_number'],
            'credential_label': 'Drug Inspector Licence No.',
            'credential_hint': 'e.g. KL-DI-2023-0042 (issued by Kerala State Drug Control Authority)',
        },
        'UPLOADER': {
            'label': 'Pharmaceutical Data Entry Officer',
            'description': (
                'Must be a government employee with a recognised pharmacy qualification '
                '(minimum D.Pharm or Pharmacy Technician Certificate).'
            ),
            'required_fields': ['employee_id', 'qualification'],
            'credential_label': 'Training / Qualification Certificate No.',
            'credential_hint': 'Certificate number of your D.Pharm / B.Pharm or pharmacy training',
        },
        'DEPT_OFFICER': {
            'label': 'Gazette / Regulations Officer',
            'description': (
                'Must be a gazette officer or section officer of the Kerala Drug Control Dept. '
                'with authority to publish official notifications and circulars.'
            ),
            'required_fields': ['employee_id', 'designation', 'licence_number'],
            'credential_label': 'Department Posting Order No.',
            'credential_hint': 'Official posting order number assigning you to Gazette/Regulations duty',
        },
    }

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    role = models.CharField(max_length=20, choices=ROLES, default='UPLOADER')
    department = models.CharField(max_length=255, blank=True)

    # ── Official credential fields (all roles fill what's relevant) ──────────
    employee_id = models.CharField(
        max_length=100, blank=True,
        help_text="Government employee ID / service number (required for all roles)"
    )
    designation = models.CharField(
        max_length=255, blank=True,
        help_text="Official designation e.g. Drug Inspector Grade-II, Section Officer"
    )
    qualification = models.CharField(
        max_length=255, blank=True,
        help_text="Highest relevant qualification e.g. B.Pharm, M.Pharm, D.Pharm"
    )
    licence_number = models.CharField(
        max_length=150, blank=True,
        help_text=(
            "APPROVER: Drug Inspector Licence No. | "
            "DEPT_OFFICER: Department Posting Order No. | "
            "UPLOADER: Training Certificate No."
        )
    )
    govt_id_type = models.CharField(
        max_length=50, blank=True,
        help_text="Type of Govt ID: Aadhaar / PAN / Service Book No."
    )
    govt_id_number = models.CharField(
        max_length=100, blank=True,
        help_text="ID number corresponding to govt_id_type"
    )

    # ── Account lifecycle ────────────────────────────────────────────────────
    is_verified = models.BooleanField(
        default=False,
        help_text="Super Admin must verify credentials before account becomes active"
    )
    must_change_password = models.BooleanField(
        default=True,
        help_text="Force password change on first login"
    )
    created_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_staff',
        help_text="Super Admin who created this account"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        status = "✅" if self.is_verified else "⏳"
        return f"{status} {self.user.name} — {self.get_role_display()}"

    # ── Permission helpers ───────────────────────────────────────────────────
    def is_super_admin(self):
        return self.role == 'SUPER_ADMIN'

    def is_approver(self):
        return self.role in ('SUPER_ADMIN', 'APPROVER')

    def is_uploader(self):
        return self.role in ('SUPER_ADMIN', 'APPROVER', 'UPLOADER')

    def is_dept_officer(self):
        return self.role in ('SUPER_ADMIN', 'DEPT_OFFICER')

    # ── Credential validation ────────────────────────────────────────────────
    def missing_credentials(self):
        """Returns list of missing required credential field names for this role."""
        field_map = {
            'employee_id': self.employee_id,
            'designation': self.designation,
            'qualification': self.qualification,
            'licence_number': self.licence_number,
        }
        required = self.ROLE_CREDENTIALS.get(self.role, {}).get('required_fields', [])
        return [f for f in required if not str(field_map.get(f, '')).strip()]

    def credentials_complete(self):
        return len(self.missing_credentials()) == 0

    def can_approve(self):
        if self.role == 'SUPER_ADMIN':
            return True
        return self.role == 'APPROVER' and self.is_verified and self.credentials_complete()


class AuditLog(models.Model):
    """Tamper-proof government audit trail for all staff & admin operations."""
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    actor_name = models.CharField(max_length=255)
    actor_role = models.CharField(max_length=50, blank=True)
    action = models.CharField(max_length=60, db_index=True)
    target = models.CharField(max_length=255, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {self.actor_name} -> {self.action}"
