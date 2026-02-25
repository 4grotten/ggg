from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts_apps', '0007_profiles_is_blocked_profiles_is_vip_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profiles',
            name='daily_usdt_send_limit',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='profiles',
            name='monthly_usdt_send_limit',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='profiles',
            name='daily_usdt_receive_limit',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='profiles',
            name='monthly_usdt_receive_limit',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
    ]
