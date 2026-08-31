def test_user_registration_and_login(client):
    # 1. Register User
    reg_payload = {
        "email": "alice@cretivra.ai",
        "password": "securepassword123",
        "full_name": "Alice Wonderland"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@cretivra.ai"
    alice_token = data["access_token"]

    # 2. Prevent duplicate registration
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 400

    # 3. Login
    login_payload = {
        "email": "alice@cretivra.ai",
        "password": "securepassword123"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200
    assert "access_token" in res.json()

    # 4. Wrong password fails
    bad_login = {
        "email": "alice@cretivra.ai",
        "password": "wrongpassword"
    }
    res = client.post("/api/auth/login", json=bad_login)
    assert res.status_code == 401

    # 5. Fetch /me profile
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {alice_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "alice@cretivra.ai"

def test_multi_user_chat_and_search_isolation(client):
    # Register User 1 (Alice)
    res_a = client.post("/api/auth/register", json={
        "email": "user_a@cretivra.ai",
        "password": "passwordA123",
        "full_name": "User A"
    })
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User 2 (Bob)
    res_b = client.post("/api/auth/register", json={
        "email": "user_b@cretivra.ai",
        "password": "passwordB123",
        "full_name": "User B"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Alice creates a secret conversation
    res = client.post("/api/conversations", json={"title": "Alice Quantum Research", "model_id": "cretivra-1"}, headers=headers_a)
    assert res.status_code == 201
    conv_alice_id = res.json()["id"]

    # Bob creates a secret conversation
    res = client.post("/api/conversations", json={"title": "Bob Blockchain Project", "model_id": "cretivra-1"}, headers=headers_b)
    assert res.status_code == 201
    conv_bob_id = res.json()["id"]

    # Alice lists conversations -> should ONLY see Alice's chat
    res = client.get("/api/conversations", headers=headers_a)
    alice_chats = [c["id"] for c in res.json()["conversations"]]
    assert conv_alice_id in alice_chats
    assert conv_bob_id not in alice_chats

    # Bob lists conversations -> should ONLY see Bob's chat
    res = client.get("/api/conversations", headers=headers_b)
    bob_chats = [c["id"] for c in res.json()["conversations"]]
    assert conv_bob_id in bob_chats
    assert conv_alice_id not in bob_chats

    # Alice searches for "Blockchain" -> should return 0 results
    res = client.get("/api/conversations?q=Blockchain", headers=headers_a)
    assert len(res.json()["conversations"]) == 0

    # Alice searches for "Quantum" -> should return 1 result
    res = client.get("/api/conversations?q=Quantum", headers=headers_a)
    assert len(res.json()["conversations"]) == 1
    assert res.json()["conversations"][0]["id"] == conv_alice_id

    # Alice tries to read Bob's conversation directly -> Access Denied 403
    res = client.get(f"/api/conversations/{conv_bob_id}", headers=headers_a)
    assert res.status_code == 403

    # Alice tries to delete Bob's conversation directly -> Access Denied 403
    res = client.delete(f"/api/conversations/{conv_bob_id}", headers=headers_a)
    assert res.status_code == 403
