from cryptography.fernet import Fernet
import os


class EncryptManager:
    _instance = None
    _key_file_path = os.path.join(os.path.dirname(__file__), 'encryption_key.txt')

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.key = cls._instance._load_or_generate_key()
            cls._instance.cipher = Fernet(cls._instance.key)
        return cls._instance

    def _load_or_generate_key(self):
        """Load the key from the file or generate a new one if not present."""
        if os.path.exists(self._key_file_path):
            with open(self._key_file_path, "rb") as key_file:
                return key_file.read()
        else:
            key = Fernet.generate_key()
            with open(self._key_file_path, "wb") as key_file:
                key_file.write(key)
            return key

    def encrypt_data(self, data: str) -> str:
        """Encrypt the provided data using the encryption key."""
        return self.cipher.encrypt(data.encode()).decode('utf-8')

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt the provided data using the encryption key."""
        return self.cipher.decrypt(encrypted_data.encode()).decode('utf-8')
