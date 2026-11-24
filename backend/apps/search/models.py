from django.db import models


class SearchLog(models.Model):
    batch_no = models.CharField(max_length=100)
    drug_name = models.CharField(max_length=255)
    result_shown = models.CharField(max_length=50)
    user = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='searches'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Search: {self.batch_no} / {self.drug_name} → {self.result_shown}"
