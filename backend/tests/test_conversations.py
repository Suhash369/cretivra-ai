def test_conversation_crud(client):
    # 1. Create conversation
    res = client.post("/api/conversations", json={"title": "Test Chat", "model_id": "cretivra-1"})
    assert res.status_code == 201
    conv = res.json()
    conv_id = conv["id"]
    assert conv["title"] == "Test Chat"

    # 2. Get conversation
    res = client.get(f"/api/conversations/{conv_id}")
    assert res.status_code == 200
    assert res.json()["id"] == conv_id

    # 3. Rename conversation
    res = client.patch(f"/api/conversations/{conv_id}", json={"title": "Renamed Chat"})
    assert res.status_code == 200
    assert res.json()["title"] == "Renamed Chat"

    # 4. List conversations
    res = client.get("/api/conversations")
    assert res.status_code == 200
    data = res.json()
    assert "grouped" in data
    assert any(c["id"] == conv_id for c in data["conversations"])

    # 5. Delete conversation
    res = client.delete(f"/api/conversations/{conv_id}")
    assert res.status_code == 204

    # 6. Verify deleted
    res = client.get(f"/api/conversations/{conv_id}")
    assert res.status_code == 404
