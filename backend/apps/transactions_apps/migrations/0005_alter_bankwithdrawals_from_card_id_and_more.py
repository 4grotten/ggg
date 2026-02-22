from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions_apps', '0004_cryptowallets_bankdepositaccounts_balance_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bankwithdrawals',
            name='from_card_id',
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='bankwithdrawals',
            name='from_bank_account_id',
            field=models.UUIDField(blank=True, null=True),
        ),
    ]
