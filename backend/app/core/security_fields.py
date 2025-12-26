import os
from cryptography.fernet import Fernet

# 🔐 Load Key from Environment or Generate a fallback (for dev)
# In Production (Railway), you MUST run `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
# and paste that value into your RAILWAY VARIABLES as 'ENCRYPTION_KEY'
KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher_suite = Fernet(KEY.encode())

def encrypt_text(text: str) -> str:
    if not text:
        return None
    return cipher_suite.encrypt(text.encode()).decode()

def decrypt_text(text: str) -> str:
    if not text:
        return None
    try:
        return cipher_suite.decrypt(text.encode()).decode()
    except Exception:
        return "Decryption Failed"