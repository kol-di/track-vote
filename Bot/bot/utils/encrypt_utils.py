import os
import base64
import gzip
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

class EncryptManager:
    _instance = None
    _key_file_path = os.path.join(os.path.dirname(__file__), 'encryption_key.txt')
    _password = b'secure_password'  # Can be replaced with your desired key management
    _salt_length = 16  # Size of the salt
    _iv_length = 8  # Smaller IV
    _tag_length = 16  # Smaller tag

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.key = cls._instance._load_or_generate_key()
        return cls._instance

    def _load_or_generate_key(self):
        """Load the salt from the file or generate a new one if not present."""
        if os.path.exists(self._key_file_path):
            with open(self._key_file_path, "rb") as key_file:
                return key_file.read()
        else:
            salt = os.urandom(self._salt_length)
            with open(self._key_file_path, "wb") as key_file:
                key_file.write(salt)
            return salt

    def _derive_key(self):
        """Derive a key using PBKDF2 with a fixed password and stored salt."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.key,
            iterations=10000,
            backend=default_backend()
        )
        return kdf.derive(self._password)


    def encrypt_data(self, data: str) -> str:
        """Encrypt data using AES-GCM without gzip compression."""
        key = self._derive_key()
        iv = os.urandom(self._iv_length)
        cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        ciphertext = encryptor.update(data.encode('utf-8')) + encryptor.finalize()
        encrypted_data = iv + encryptor.tag + ciphertext

        return base64.urlsafe_b64encode(encrypted_data).decode('utf-8')

    def decrypt_data(self, encoded_data: str) -> str:
        """Decrypt data using AES-GCM without gzip compression."""
        decoded_data = base64.urlsafe_b64decode(encoded_data)
        key = self._derive_key()
        iv = decoded_data[:self._iv_length]
        tag = decoded_data[self._iv_length:self._iv_length + self._tag_length]
        ciphertext = decoded_data[self._iv_length + self._tag_length:]
        cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
        decryptor = cipher.decryptor()

        return decryptor.update(ciphertext) + decryptor.finalize()
