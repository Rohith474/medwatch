from django.db import models


class Manufacturer(models.Model):
    name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    state = models.CharField(max_length=100)
    contact = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Drug(models.Model):
    brand_name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255)
    salt_composition = models.TextField(blank=True)
    dosage_form = models.CharField(max_length=100, blank=True)
    manufacturer = models.ForeignKey(
        Manufacturer, on_delete=models.SET_NULL, null=True, related_name='drugs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['brand_name']

    def __str__(self):
        return f"{self.brand_name} ({self.generic_name})"


class ResultType(models.TextChoices):
    NSQ = 'NSQ', 'Not of Standard Quality'
    SPURIOUS = 'SPURIOUS', 'Spurious Drug'
    ADULTERATED = 'ADULTERATED', 'Adulterated Drug'
    MISBRANDED = 'MISBRANDED', 'Misbranded Drug'
    NO_ADVERSE = 'NO_ADVERSE', 'No Adverse Report Found'


class LabResult(models.Model):
    drug = models.ForeignKey(Drug, on_delete=models.CASCADE, related_name='results')
    batch_no = models.CharField(max_length=100, db_index=True)
    lab = models.ForeignKey('labs.Lab', on_delete=models.SET_NULL, null=True, related_name='results')
    result_type = models.CharField(max_length=20, choices=ResultType.choices)
    sample_id = models.CharField(max_length=100, blank=True)
    test_date = models.DateField(null=True, blank=True)
    report_ref = models.CharField(max_length=255, blank=True)
    action_taken = models.TextField(blank=True)
    source = models.CharField(
        max_length=100,
        choices=[('CDSCO', 'CDSCO'), ('STATE_LAB', 'State Lab'), ('KERALA_DC', 'Kerala Drug Control')],
        default='CDSCO'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-test_date']
        indexes = [
            models.Index(fields=['batch_no']),
            models.Index(fields=['result_type']),
        ]

    def __str__(self):
        return f"{self.drug.brand_name} | Batch: {self.batch_no} | {self.result_type}"


class CitizenReport(models.Model):
    """Anonymous (or optional-contact) citizen report of suspected fake/adverse medicine."""
    ISSUE_TYPES = [
        ('SUSPECTED_FAKE', 'Suspected Spurious / Fake Medicine'),
        ('ADVERSE_REACTION', 'Adverse Side Effect / Reaction'),
        ('TAMPERED_PACKAGING', 'Broken Seal / Tampered Label'),
        ('QUALITY_ISSUE', 'Discoloration / Spoiled / Foul Smell'),
    ]
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('UNDER_REVIEW', 'Under Review'),
        ('RESOLVED', 'Resolved / Action Taken'),
        ('DISMISSED', 'Dismissed'),
    ]

    drug_name = models.CharField(max_length=255)
    batch_no = models.CharField(max_length=100, blank=True)
    manufacturer_name = models.CharField(max_length=255, blank=True)
    issue_type = models.CharField(max_length=30, choices=ISSUE_TYPES, default='SUSPECTED_FAKE')
    pharmacy_or_location = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    reporter_contact = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    inspector_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"MW-RPT-{self.id} | {self.drug_name} ({self.issue_type})"
