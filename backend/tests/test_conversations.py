def get_auth_client_headers(client):
    res = client.post("/api/auth/register", json={
        "email": "tester_conv@cretivra.ai",
        "password": "password123",
        "full_name": "Conv Tester"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_conversation_crud(client):
    headers = get_auth_client_headers(client)

    # 1. Create conversation
    res = client.post("/api/conversations", json={"title": "Test Chat", "model_id": "cretivra-1"}, headers=headers)
    assert res.status_code == 201
    conv = res.json()
    conv_id = conv["id"]
    assert conv["title"] == "Test Chat"

    # 2. Get conversation
    res = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == conv_id

    # 3. Rename conversation
    res = client.patch(f"/api/conversations/{conv_id}", json={"title": "Renamed Chat"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Renamed Chat"

    # 4. List conversations
    res = client.get("/api/conversations", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "grouped" in data
    assert any(c["id"] == conv_id for c in data["conversations"])

    # 5. Delete conversation
    res = client.delete(f"/api/conversations/{conv_id}", headers=headers)
    assert res.status_code == 204

    # 6. Verify deleted
    res = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert res.status_code == 404
