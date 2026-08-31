import os
import re
import hashlib
import secrets
import json
import base64
import time
from typing import Optional, Dict, Any

SECRET_KEY = os.getenv("SECRET_KEY", "cretivra-secret-key-change-in-production-vault")

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and unwanted characters.
    """
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', clean_name)
    return clean_name or "file"

def validate_path_safety(file_path: str, base_dir: str) -> bool:
    """
    Ensure the path is strictly within the allowed base directory.
    """
    abs_base = os.path.abspath(base_dir)
    abs_target = os.path.abspath(file_path)
    return abs_target.startswith(abs_base)

def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256 with random salt."""
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}${pw_hash}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify raw password against stored PBKDF2 salt$hash string."""
    try:
        salt, pw_hash = stored_hash.split('$')
        computed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return secrets.compare_digest(computed, pw_hash)
    except Exception:
        return False

def create_access_token(user_id: str, email: str, expires_delta: int = 86400 * 30) -> str:
    """Create lightweight, secure JWT-style access token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time()) + expires_delta
    }
    b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signature_raw = f"{b64_header}.{b64_payload}".encode()
    signature = hmac_sign(signature_raw, SECRET_KEY)
    
    return f"{b64_header}.{b64_payload}.{signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT token signature & expiration."""
    try:
        parts = token.split(".")
        if len(parts) != 3: return None
        b64_header, b64_payload, signature = parts
        
        signature_check = hmac_sign(f"{b64_header}.{b64_payload}".encode(), SECRET_KEY)
        if not secrets.compare_digest(signature, signature_check):
            return None

        # Pad base64 string
        pad = len(b64_payload) % 4
        if pad: b64_payload += "=" * (4 - pad)
        
        payload = json.loads(base64.urlsafe_b64decode(b64_payload).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def hmac_sign(data: bytes, key: str) -> str:
    """HMAC-SHA256 signature generator."""
    import hmac
    return base64.urlsafe_b64encode(
        hmac.new(key.encode(), data, hashlib.sha256).digest()
    ).decode().rstrip("=")
