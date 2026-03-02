from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts_apps', '0009_alter_profiles_referral_level_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profiles',
            name='daily_top_up_limit',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name='profiles',
            name='monthly_top_up_limit',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
    ]
