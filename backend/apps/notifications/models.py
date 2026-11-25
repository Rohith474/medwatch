from django.db import models


class Notification(models.Model):
    SEVERITY_LEVELS = [
        ('CRITICAL', 'Critical Recall (Immediate Health Hazard)'),
        ('STANDARD', 'Standard NSQ Defect'),
        ('ADVISORY', 'Packaging / Regulatory Advisory'),
    ]

    title = models.CharField(max_length=255, help_text="Full internal alert title")
    body = models.TextField(help_text="Detailed medical alert description")
    
    # DPDP Act 2023 Privacy Safeguard: Safe text displayed on lock screens
    discreet_title = models.CharField(
        max_length=255, 
        default="MEDWATCH Official Drug Safety Notice",
        help_text="Privacy-safe title displayed on public lock screens"
    )
    discreet_body = models.CharField(
        max_length=500, 
        default="A new safety circular has been issued by Kerala Drug Control. Tap to view securely in app.",
        help_text="Privacy-safe preview with no sensitive medical or drug names"
    )
    
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='STANDARD')
    affected_batch = models.CharField(max_length=100, blank=True)
    drug = models.ForeignKey(
        'drugs.Drug', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications'
    )
    created_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, related_name='created_notifications'
    )
    approved_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_notifications'
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.title}"


class PushSubscription(models.Model):
    """Anonymous browser/device Web Push subscription (VAPID — 100% free)."""
    endpoint = models.URLField(max_length=500, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    privacy_mode = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PushSub #{self.id} ({self.endpoint[:45]}...)"
