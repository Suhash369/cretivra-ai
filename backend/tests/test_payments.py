def test_free_unrestricted_ai_access(client):
    # 1. Register a new user
    res = client.post("/api/auth/register", json={
        "email": "free_user@cretivra.ai",
        "password": "securepass123",
        "full_name": "Free User"
    })
    assert res.status_code == 201
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Directly chat with zero payment barrier
    chat_res = client.post("/api/chat/stream", json={"message": "Hello Cretivra AI Free!", "model_id": "cretivra-1"}, headers=headers)
    assert chat_res.status_code == 200
    assert "text/event-stream" in chat_res.headers["content-type"]
