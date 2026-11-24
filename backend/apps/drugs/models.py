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
