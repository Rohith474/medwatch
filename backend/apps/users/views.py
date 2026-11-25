import random
import string
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPRecord, AdminUser
from django.conf import settings


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


def send_otp_sms(mobile, otp):
    """Send OTP via MSG91 or Twilio."""
    import requests
    if settings.OTP_PROVIDER == 'msg91':
        url = "https://api.msg91.com/api/v5/otp"
        payload = {
            "template_id": settings.MSG91_TEMPLATE_ID,
            "mobile": mobile,
            "authkey": settings.MSG91_AUTH_KEY,
            "otp": otp,
        }
        try:
            requests.post(url, json=payload, timeout=5)
        except Exception:
            pass
    # In development, just print the OTP
    print(f"[DEV] OTP for {mobile}: {otp}")


class OTPRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        mobile = request.data.get('mobile', '').strip()
        if not mobile or len(mobile) < 10:
            return Response({'error': 'Valid mobile number is required.'}, status=400)

        otp = generate_otp()
        expires_at = timezone.now() + timedelta(minutes=10)

        OTPRecord.objects.create(mobile=mobile, otp=otp, expires_at=expires_at)
        send_otp_sms(mobile, otp)

        return Response({'message': f'OTP sent to {mobile}.'})


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = request.data.get('mobile', '').strip()
        otp = request.data.get('otp', '').strip()
        name = request.data.get('name', '').strip()

        if not mobile or not otp:
            return Response({'error': 'Mobile and OTP are required.'}, status=400)

        record = OTPRecord.objects.filter(
            mobile=mobile,
            otp=otp,
            is_used=False,
            expires_at__gte=timezone.now()
        ).order_by('-created_at').first()

        if not record:
            return Response({'error': 'Invalid or expired OTP.'}, status=400)

        record.is_used = True
        record.save()

        user, created = User.objects.get_or_create(
            mobile=mobile,
            defaults={'name': name or mobile}
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': user.name,
                'mobile': user.mobile,
                'is_new': created,
            }
        })


class StaffLoginView(APIView):
    """Password-based login for staff (not OTP). Returns JWT + role."""
    permission_classes = [AllowAny]

    def post(self, request):
        mobile = request.data.get('mobile', '').strip()
        password = request.data.get('password', '').strip()

        if not mobile or not password:
            return Response({'error': 'Mobile and password are required.'}, status=400)

        try:
            user = User.objects.get(mobile=mobile)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=401)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=401)

        if not user.is_staff:
            return Response({'error': 'You do not have staff access.'}, status=403)

        try:
            profile = user.admin_profile
            role = profile.role
            department = profile.department

            # All roles (except Super Admin) must be verified before login
            if role != 'SUPER_ADMIN' and not profile.is_verified:
                return Response({
                    'error': (
                        'Your account is pending verification by the Super Admin. '
                        'Your credentials and qualifications are being reviewed. '
                        'You will be notified once approved.'
                    )
                }, status=403)

            # All roles must have complete credentials
            if role != 'SUPER_ADMIN':
                missing = profile.missing_credentials()
                if missing:
                    from .models import AdminUser as AU
                    cfg = AU.ROLE_CREDENTIALS.get(role, {})
                    return Response({
                        'error': (
                            f'Your account is missing required credentials for the '
                            f'{cfg.get("label", role)} role: {", ".join(missing)}. '
                            f'Contact the Super Admin to update your profile.'
                        )
                    }, status=403)

            must_change = profile.must_change_password
            # Log IP
            ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
            profile.last_login_ip = ip.split(',')[0].strip()
            profile.save(update_fields=['last_login_ip'])

        except Exception:
            role = 'SUPER_ADMIN' if user.is_superuser else None
            department = ''
            must_change = False

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'must_change_password': must_change,
            'user': {
                'id': user.id,
                'name': user.name,
                'mobile': user.mobile,
                'role': role,
                'department': department,
            }
        })


class StaffPendingResultsView(APIView):
    """Approver: list lab results awaiting approval (is_active=False)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.drugs.models import LabResult
        from apps.drugs.serializers import LabResultSerializer
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None

        if role not in ('SUPER_ADMIN', 'APPROVER'):
            return Response({'error': 'Permission denied.'}, status=403)

        results = LabResult.objects.filter(is_active=False).select_related('drug', 'lab')
        data = [{
            'id': r.id,
            'drug_name': r.drug.brand_name if r.drug else '',
            'generic_name': r.drug.generic_name if r.drug else '',
            'batch_no': r.batch_no,
            'result_type': r.result_type,
            'lab': r.lab.name if r.lab else '',
            'test_date': str(r.test_date),
            'source': r.source,
        } for r in results]
        return Response(data)

    def patch(self, request, pk):
        """Approve (is_active=True) or reject (delete) a result."""
        from apps.drugs.models import LabResult
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None

        if role not in ('SUPER_ADMIN', 'APPROVER'):
            return Response({'error': 'Permission denied.'}, status=403)

        try:
            result = LabResult.objects.get(pk=pk)
        except LabResult.DoesNotExist:
            return Response({'error': 'Record not found.'}, status=404)

        action = request.data.get('action')  # 'approve' or 'reject'
        if action == 'approve':
            result.is_active = True
            result.save()
            return Response({'message': 'Record approved and is now live.'})
        elif action == 'reject':
            result.delete()
            return Response({'message': 'Record rejected and deleted.'})
        return Response({'error': 'Invalid action. Use approve or reject.'}, status=400)


class StaffAddDrugView(APIView):
    """Uploader: add a new drug + lab result record."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.drugs.models import Drug, LabResult, Manufacturer
        from apps.labs.models import Lab
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None

        if role not in ('SUPER_ADMIN', 'UPLOADER'):
            return Response({'error': 'Permission denied.'}, status=403)

        d = request.data
        # Find or create manufacturer
        mfr, _ = Manufacturer.objects.get_or_create(
            name=d.get('manufacturer_name', 'Unknown'),
            defaults={'license_number': d.get('license_number', ''), 'state': d.get('state', 'Kerala')}
        )
        # Find or create drug
        drug, _ = Drug.objects.get_or_create(
            brand_name=d.get('brand_name', ''),
            generic_name=d.get('generic_name', ''),
            defaults={'manufacturer': mfr, 'dosage_form': d.get('dosage_form', '')}
        )
        # Create lab result (pending approval by default)
        lab = Lab.objects.filter(name__icontains=d.get('lab_name', '')).first()
        result = LabResult.objects.create(
            drug=drug,
            batch_no=d.get('batch_no', ''),
            result_type=d.get('result_type', 'NSQ'),
            lab=lab,
            test_date=d.get('test_date'),
            action_taken=d.get('action_taken', ''),
            source='MANUAL',
            is_active=False,  # Needs approver sign-off
        )
        return Response({
            'message': 'Drug record submitted. Pending approver review.',
            'result_id': result.id,
        }, status=201)


class StaffAddRegulationView(APIView):
    """Dept Officer: add a new regulation/circular."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.regulations.models import Regulation
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role not in ('SUPER_ADMIN', 'DEPT_OFFICER'):
            return Response({'error': 'Permission denied.'}, status=403)
        from apps.regulations.models import Regulation
        regs = Regulation.objects.filter(is_active=True).order_by('-issued_on')
        return Response([{
            'id': r.id, 'title': r.title, 'issued_by': r.issued_by,
            'issued_on': str(r.issued_on), 'description': r.description,
        } for r in regs])

    def post(self, request):
        from apps.regulations.models import Regulation
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role not in ('SUPER_ADMIN', 'DEPT_OFFICER'):
            return Response({'error': 'Permission denied.'}, status=403)

        d = request.data
        reg = Regulation.objects.create(
            title=d.get('title', ''),
            description=d.get('description', ''),
            issued_by=d.get('issued_by', ''),
            issued_on=d.get('issued_on'),
            is_active=True,
        )
        return Response({'message': 'Regulation published.', 'id': reg.id}, status=201)

    def delete(self, request, pk=None):
        from apps.regulations.models import Regulation
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role not in ('SUPER_ADMIN', 'DEPT_OFFICER'):
            return Response({'error': 'Permission denied.'}, status=403)
        try:
            reg = Regulation.objects.get(pk=pk)
        except Regulation.DoesNotExist:
            return Response({'error': 'Regulation not found.'}, status=404)
        reg.delete()
        return Response({'message': 'Regulation deleted.'})


class StaffDashboardStatsView(APIView):
    """Super Admin: dashboard stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.drugs.models import LabResult
        from apps.regulations.models import Regulation
        from apps.notifications.models import Notification
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role != 'SUPER_ADMIN':
            return Response({'error': 'Permission denied.'}, status=403)
        return Response({
            'pending_approvals': LabResult.objects.filter(is_active=False).count(),
            'live_alerts': LabResult.objects.filter(is_active=True).count(),
            'regulations': Regulation.objects.filter(is_active=True).count(),
            'notifications_sent': Notification.objects.filter(is_sent=True).count(),
            'total_staff': AdminUser.objects.count(),
        })


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'name': user.name,
            'mobile': user.mobile,
            'email': user.email,
            'state': user.state,
            'district': user.district,
        })

    def patch(self, request):
        user = request.user
        for field in ['name', 'email', 'state', 'district', 'fcm_token']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response({'message': 'Profile updated.'})


# ──────────────────────────────────────────────────────────────────────────────
# STAFF MANAGEMENT — Super Admin only
# ──────────────────────────────────────────────────────────────────────────────

class StaffManagementView(APIView):
    """List all staff accounts or create a new one (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def _require_super_admin(self, request):
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        return role == 'SUPER_ADMIN'

    def get(self, request):
        if not self._require_super_admin(request):
            return Response({'error': 'Permission denied.'}, status=403)

        staff_list = []
        for profile in AdminUser.objects.select_related('user').all().order_by('-created_at'):
            staff_list.append({
                'id': profile.id,
                'name': profile.user.name,
                'mobile': profile.user.mobile,
                'role': profile.role,
                'department': profile.department,
                'employee_id': profile.employee_id,
                'designation': profile.designation,
                'qualification': profile.qualification,
                'licence_number': profile.licence_number,
                'govt_id_type': profile.govt_id_type,
                'govt_id_number': profile.govt_id_number,
                'is_verified': profile.is_verified,
                'must_change_password': profile.must_change_password,
                'created_at': str(profile.created_at),
                'verified_at': str(profile.verified_at) if profile.verified_at else None,
                'credentials_complete': profile.credentials_complete(),
                'missing_credentials': profile.missing_credentials(),
            })
        return Response(staff_list)

    def post(self, request):
        if not self._require_super_admin(request):
            return Response({'error': 'Permission denied.'}, status=403)

        d = request.data
        mobile = d.get('mobile', '').strip()
        name = d.get('name', '').strip()
        password = d.get('password', '').strip()
        role = d.get('role', '').strip()

        if not all([mobile, name, password, role]):
            return Response({'error': 'name, mobile, password and role are required.'}, status=400)

        if role not in dict(AdminUser.ROLES):
            return Response({'error': f'Invalid role. Choose from: {", ".join(dict(AdminUser.ROLES).keys())}'}, status=400)

        if User.objects.filter(mobile=mobile).exists():
            return Response({'error': 'A user with this mobile number already exists.'}, status=400)

        # Validate required credential fields for the given role
        cfg = AdminUser.ROLE_CREDENTIALS.get(role, {})
        required_fields = cfg.get('required_fields', [])
        missing = [f for f in required_fields if not d.get(f, '').strip()]
        if missing:
            return Response({
                'error': f'Missing required credentials for {cfg.get("label", role)}: {", ".join(missing)}'
            }, status=400)

        # Create the User account
        user = User.objects.create_user(
            mobile=mobile,
            password=password,
            name=name,
        )
        user.is_staff = True
        user.save()

        # Create the AdminUser profile
        profile = AdminUser.objects.create(
            user=user,
            role=role,
            department=d.get('department', ''),
            employee_id=d.get('employee_id', ''),
            designation=d.get('designation', ''),
            qualification=d.get('qualification', ''),
            licence_number=d.get('licence_number', ''),
            govt_id_type=d.get('govt_id_type', ''),
            govt_id_number=d.get('govt_id_number', ''),
            is_verified=False,          # Requires explicit Super Admin verification
            must_change_password=True,  # Must set a new password on first login
            created_by=request.user,
        )

        return Response({
            'message': f'Staff account created for {name}. Account is pending verification.',
            'user_id': user.id,
            'profile_id': profile.id,
        }, status=201)


class StaffVerifyView(APIView):
    """Verify or suspend a staff account (Super Admin only)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role != 'SUPER_ADMIN':
            return Response({'error': 'Permission denied.'}, status=403)

        try:
            profile = AdminUser.objects.get(pk=pk)
        except AdminUser.DoesNotExist:
            return Response({'error': 'Staff profile not found.'}, status=404)

        action = request.data.get('action')  # 'verify' or 'suspend'

        if action == 'verify':
            # Check credentials are complete before verifying
            missing = profile.missing_credentials()
            if missing:
                return Response({
                    'error': f'Cannot verify: missing credentials — {", ".join(missing)}. Update the profile first.'
                }, status=400)
            profile.is_verified = True
            profile.verified_at = timezone.now()
            profile.save(update_fields=['is_verified', 'verified_at'])
            return Response({'message': f'{profile.user.name} has been verified and can now log in.'})

        elif action == 'suspend':
            profile.is_verified = False
            profile.save(update_fields=['is_verified'])
            return Response({'message': f'{profile.user.name} has been suspended.'})

        return Response({'error': 'Invalid action. Use "verify" or "suspend".'}, status=400)


class StaffChangePasswordView(APIView):
    """Change password — required on first login (must_change_password=True)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password', '').strip()
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        user = request.user
        user.set_password(new_password)
        user.save()

        # Mark must_change_password = False
        try:
            profile = user.admin_profile
            profile.must_change_password = False
            profile.save(update_fields=['must_change_password'])
        except Exception:
            pass

        return Response({'message': 'Password changed successfully. Please log in again.'})


class StaffSendNotificationView(APIView):
    """Super Admin / Dept Officer: send an alert notification."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.notifications.models import Notification
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role not in ('SUPER_ADMIN', 'DEPT_OFFICER'):
            return Response({'error': 'Permission denied.'}, status=403)

        d = request.data
        notif = Notification.objects.create(
            title=d.get('title', ''),
            body=d.get('body', ''),
            discreet_title=d.get('discreet_title', 'Health Advisory'),
            discreet_body=d.get('discreet_body', 'Tap to view important health information.'),
            severity=d.get('severity', 'STANDARD'),
            affected_batch=d.get('affected_batch', ''),
            created_by=request.user,
            is_sent=True,
            sent_at=timezone.now(),
        )
        from apps.notifications.push_service import send_web_push_to_all
        push_stats = send_web_push_to_all(notif)
        return Response({
            'message': f'Notification sent! Pushed to {push_stats["sent"]} subscribed device(s).',
            'id': notif.id,
            'push_stats': push_stats,
        }, status=201)


class StaffRegisterView(APIView):
    """Public staff application endpoint.
    - APPROVER / UPLOADER / DEPT_OFFICER start unverified until Super Admin approves.
    - SUPER_ADMIN requires the Department Master Authorization Code to register with full control.
    """
    permission_classes = [AllowAny]

    ALLOWED_ROLES = ('SUPER_ADMIN', 'APPROVER', 'UPLOADER', 'DEPT_OFFICER')

    def post(self, request):
        d = request.data
        mobile = d.get('mobile', '').strip()
        name = d.get('name', '').strip()
        password = d.get('password', '').strip()
        role = d.get('role', '').strip()

        if not all([mobile, name, password, role]):
            return Response({'error': 'Name, mobile, password, and role are required.'}, status=400)

        if len(mobile) < 10:
            return Response({'error': 'Please enter a valid 10-digit mobile number.'}, status=400)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=400)

        if role not in self.ALLOWED_ROLES:
            return Response({
                'error': f'Invalid role for registration. Choose from: {", ".join(self.ALLOWED_ROLES)}'
            }, status=400)

        is_super = (role == 'SUPER_ADMIN')
        if is_super:
            expected_code = getattr(settings, 'SUPER_ADMIN_AUTH_CODE', 'KDC-ADMIN-2024')
            provided_code = d.get('admin_auth_code', '').strip()
            if provided_code != expected_code:
                return Response({
                    'error': 'Invalid Super Admin Authorization Code. Contact the Kerala Drug Control IT Wing.'
                }, status=403)

        if User.objects.filter(mobile=mobile).exists():
            return Response({'error': 'An account with this mobile number already exists.'}, status=400)

        cfg = AdminUser.ROLE_CREDENTIALS.get(role, {})
        required_fields = cfg.get('required_fields', [])
        missing = [f for f in required_fields if not d.get(f, '').strip()]
        if missing:
            return Response({
                'error': f'Missing required credentials for {cfg.get("label", role)}: {", ".join(missing)}'
            }, status=400)

        user = User.objects.create_user(
            mobile=mobile,
            password=password,
            name=name,
        )
        user.is_staff = True
        if is_super:
            user.is_superuser = True
        user.save()

        profile = AdminUser.objects.create(
            user=user,
            role=role,
            department=d.get('department', '').strip(),
            employee_id=d.get('employee_id', '').strip(),
            designation=d.get('designation', '').strip(),
            qualification=d.get('qualification', '').strip(),
            licence_number=d.get('licence_number', '').strip(),
            govt_id_type=d.get('govt_id_type', '').strip(),
            govt_id_number=d.get('govt_id_number', '').strip(),
            is_verified=is_super,
            verified_at=timezone.now() if is_super else None,
            must_change_password=False,
        )

        if is_super:
            return Response({
                'message': f'Super Admin account activated for {name}. You now have full control and can log in immediately.',
                'profile_id': profile.id,
                'auto_verified': True,
            }, status=201)

        return Response({
            'message': (
                f'Application submitted for {name} ({cfg.get("label", role)}). '
                'Your credentials are pending verification by the Super Admin before you can log in.'
            ),
            'profile_id': profile.id,
            'auto_verified': False,
        }, status=201)


class StaffDeleteView(APIView):
    """Super Admin: delete a staff account."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role != 'SUPER_ADMIN':
            return Response({'error': 'Permission denied.'}, status=403)

        try:
            profile = AdminUser.objects.select_related('user').get(pk=pk)
        except AdminUser.DoesNotExist:
            return Response({'error': 'Staff profile not found.'}, status=404)

        if profile.user_id == request.user.id:
            return Response({'error': 'You cannot delete your own Super Admin account.'}, status=400)

        name = profile.user.name
        profile.user.delete()
        return Response({'message': f'Staff account "{name}" has been deleted.'})


class StaffDrugManageView(APIView):
    """Super Admin: view full drug/lab-result list, toggle active status, or delete records."""
    permission_classes = [IsAuthenticated]

    def _is_super_admin(self, request):
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        return role == 'SUPER_ADMIN'

    def get(self, request):
        if not self._is_super_admin(request):
            return Response({'error': 'Permission denied.'}, status=403)

        from django.db.models import Q
        from apps.drugs.models import LabResult

        q = request.GET.get('q', '').strip()
        qs = LabResult.objects.select_related('drug', 'drug__manufacturer', 'lab').order_by('-created_at')
        if q:
            qs = qs.filter(
                Q(drug__brand_name__icontains=q) |
                Q(drug__generic_name__icontains=q) |
                Q(batch_no__icontains=q) |
                Q(result_type__icontains=q)
            )

        return Response([{
            'id': r.id,
            'brand_name': r.drug.brand_name if r.drug else '',
            'generic_name': r.drug.generic_name if r.drug else '',
            'manufacturer': r.drug.manufacturer.name if (r.drug and r.drug.manufacturer) else '',
            'batch_no': r.batch_no,
            'result_type': r.result_type,
            'lab': r.lab.name if r.lab else '',
            'test_date': str(r.test_date),
            'action_taken': r.action_taken,
            'source': r.source,
            'is_active': r.is_active,
        } for r in qs[:200]])

    def patch(self, request, pk):
        if not self._is_super_admin(request):
            return Response({'error': 'Permission denied.'}, status=403)
        from apps.drugs.models import LabResult
        try:
            r = LabResult.objects.get(pk=pk)
        except LabResult.DoesNotExist:
            return Response({'error': 'Drug record not found.'}, status=404)

        if 'is_active' in request.data:
            r.is_active = bool(request.data['is_active'])
        if 'result_type' in request.data:
            r.result_type = request.data['result_type']
        if 'action_taken' in request.data:
            r.action_taken = request.data['action_taken']
        r.save()
        return Response({'message': 'Drug record updated.', 'is_active': r.is_active})

    def delete(self, request, pk):
        if not self._is_super_admin(request):
            return Response({'error': 'Permission denied.'}, status=403)
        from apps.drugs.models import LabResult
        try:
            r = LabResult.objects.get(pk=pk)
        except LabResult.DoesNotExist:
            return Response({'error': 'Drug record not found.'}, status=404)
        brand = r.drug.brand_name if r.drug else 'Record'
        batch = r.batch_no
        r.delete()
        return Response({'message': f'Deleted {brand} (Batch: {batch}).'})


class StaffCDSCOImportView(APIView):
    """Super Admin / Uploader: ingest a CDSCO or State Lab NSQ PDF into staging."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            role = request.user.admin_profile.role
        except Exception:
            role = 'SUPER_ADMIN' if request.user.is_superuser else None
        if role not in ('SUPER_ADMIN', 'UPLOADER'):
            return Response({'error': 'Permission denied.'}, status=403)

        from apps.drugs.cdsco_parser import parse_cdsco_pdf
        import requests as http_requests

        source_label = request.data.get('source', 'CDSCO')
        uploaded_file = request.FILES.get('file')
        pdf_url = request.data.get('pdf_url', '').strip()

        if not uploaded_file and not pdf_url:
            return Response({'error': 'Please upload a PDF file or provide a PDF URL.'}, status=400)

        try:
            if uploaded_file:
                result = parse_cdsco_pdf(uploaded_file.read(), source_label=source_label)
            else:
                resp = http_requests.get(pdf_url, timeout=30)
                resp.raise_for_status()
                result = parse_cdsco_pdf(resp.content, source_label=source_label)
        except Exception as exc:
            return Response({'error': f'Failed to parse PDF: {exc}'}, status=400)

        return Response({
            'message': (
                f'Imported {result["imported_count"]} record(s) into staging '
                f'({result["skipped_count"]} duplicate(s) skipped). Pending Data Approver review.'
            ),
            **result,
        }, status=201)



