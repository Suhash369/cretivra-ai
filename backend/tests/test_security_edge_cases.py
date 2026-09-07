import time
import base64
import json
from app.core.security import create_access_token, hmac_sign, SECRET_KEY

def register_and_get_token(client, email, password="password123", name="Tester"):
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": name
    })
    assert res.status_code == 201
    return res.json()["access_token"]

def test_idor_message_editing_prevented(client):
    # User A setup
    token_a = register_and_get_token(client, "user_a@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User A creates a conversation
    c_res = client.post("/api/conversations", json={"title": "User A Private Chat"}, headers=headers_a)
    conv_id = c_res.json()["id"]

    # Stream a turn to generate user and assistant messages
    s_res = client.post("/api/chat/stream", json={
        "conversation_id": conv_id,
        "message": "User A original secret message"
    }, headers=headers_a)
    assert s_res.status_code == 200

    # Fetch User A messages
    m_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers_a)
    msgs = m_res.json()
    assert len(msgs) >= 2
    user_a_msg_id = msgs[0]["id"]
    original_content = msgs[0]["content"]

    # User B setup
    token_b = register_and_get_token(client, "user_b@example.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B attempts to edit User A's message (IDOR attack)
    attack_res = client.patch(
        f"/api/messages/{user_a_msg_id}",
        json={"message": "ATTACKER OVERWRITTEN CONTENT"},
        headers=headers_b
    )
    assert attack_res.status_code == 403

    # CRITICAL QA VERIFICATION: Verify User A's original message was NOT corrupted in database
    verify_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers_a)
    verify_msgs = verify_res.json()
    assert verify_msgs[0]["content"] == original_content
    assert verify_msgs[0]["content"] != "ATTACKER OVERWRITTEN CONTENT"

def test_idor_message_regeneration_prevented(client):
    # User A setup
    token_a = register_and_get_token(client, "user_regen_a@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    c_res = client.post("/api/conversations", json={"title": "Regen Test"}, headers=headers_a)
    conv_id = c_res.json()["id"]

    s_res = client.post("/api/chat/stream", json={
        "conversation_id": conv_id,
        "message": "Hello assistant"
    }, headers=headers_a)
    assert s_res.status_code == 200

    m_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers_a)
    msgs = m_res.json()
    assistant_msg_id = msgs[1]["id"]

    # User B attempts to trigger regeneration on User A's conversation
    token_b = register_and_get_token(client, "user_regen_b@example.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    attack_res = client.post(f"/api/messages/{assistant_msg_id}/regenerate", headers=headers_b)
    assert attack_res.status_code == 403

    # Verify User A's message still exists
    verify_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers_a)
    assert len(verify_res.json()) >= 2

def test_auth_edge_cases_and_token_validation(client):
    # 1. Access protected route without authorization header
    res = client.get("/api/auth/me")
    assert res.status_code == 401

    # 2. Access with malformed bearer token
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert res.status_code == 401

    # 3. Access with expired token
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": "fake-user", "email": "fake@example.com", "exp": int(time.time()) - 3600}
    b64_h = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    b64_p = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hmac_sign(f"{b64_h}.{b64_p}".encode(), SECRET_KEY)
    expired_token = f"{b64_h}.{b64_p}.{sig}"

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401

    # 4. Short password rejection
    res = client.post("/api/auth/register", json={
        "email": "shortpw@example.com",
        "password": "123"
    })
    assert res.status_code == 400
    assert "at least 6 characters" in res.json()["detail"]

    # 5. Invalid email rejection
    res = client.post("/api/auth/register", json={
        "email": "notanemail",
        "password": "password123"
    })
    assert res.status_code == 400

    # 6. Wrong password login rejection
    client.post("/api/auth/register", json={
        "email": "validuser@example.com",
        "password": "correct_password"
    })
    wrong_login = client.post("/api/auth/login", json={
        "email": "validuser@example.com",
        "password": "wrong_password"
    })
    assert wrong_login.status_code == 401

def test_sql_injection_and_special_character_safety(client):
    token = register_and_get_token(client, "sqli_tester@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create conversation with special characters and quotes
    payloads = [
        "Test ' OR '1'='1",
        "'; DROP TABLE conversations; --",
        "Special chars <script>alert(1)</script> & <xml>",
        "Search with wildcards % and _"
    ]
    for p in payloads:
        res = client.post("/api/conversations", json={"title": p}, headers=headers)
        assert res.status_code == 201

    # Search with SQL wildcards and single quotes
    search_queries = ["'", "%", "_", "' OR '1'='1", "DROP TABLE", "<script>"]
    for q in search_queries:
        search_res = client.get(f"/api/conversations?q={q}", headers=headers)
        assert search_res.status_code == 200
        assert "conversations" in search_res.json()
