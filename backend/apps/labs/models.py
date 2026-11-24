from django.db import models


class Lab(models.Model):
    LAB_TYPES = [
        ('CENTRAL', 'Central Government Lab'),
        ('STATE', 'State Government Lab'),
        ('PRIVATE', 'Private Accredited Lab'),
    ]

    name = models.CharField(max_length=255)
    accreditation_no = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100)
    lab_type = models.CharField(max_length=20, choices=LAB_TYPES, default='STATE')
    contact = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.state})"
