from django.db import models


class Regulation(models.Model):
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    issued_by = models.CharField(max_length=255)
    issued_on = models.DateField()
    pdf_url = models.URLField(blank=True)
    pdf_file = models.FileField(upload_to='regulations/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ['-issued_on']

    def __str__(self):
        return self.title
