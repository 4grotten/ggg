

def generate_card_number(user_id: int, card_subtype: str) -> str:
    tail = str(user_id).zfill(6)
    
    if card_subtype == 'metal':
        prefix = "4532112233"
    elif card_subtype == 'virtual':
        prefix = "4532112244"
    else:
        raise ValueError("Invalid card subtype. Must be 'metal' or 'virtual'")
        
    return f"{prefix}{tail}"

def generate_iban(user_id: int) -> str:
    tail = str(user_id).zfill(6)
    prefix = "AE070331234567890"
    return f"{prefix}{tail}"