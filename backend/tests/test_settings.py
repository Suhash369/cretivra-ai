def test_get_settings(client):
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert "temperature" in data
    assert "theme" in data
    assert "default_model" in data
    assert "max_upload_size_mb" in data

def test_patch_settings(client):
    res = client.patch("/api/settings", json={
        "temperature": 0.85,
        "theme": "dark",
        "max_context_messages": 12,
        "system_prompt": "You are Cretivra Advanced Quality Test System."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["temperature"] == 0.85
    assert data["theme"] == "dark"
    assert data["max_context_messages"] == 12
    assert "Cretivra Advanced Quality Test System" in data["system_prompt"]

    # Verify persistence on subsequent GET
    get_res = client.get("/api/settings")
    assert get_res.status_code == 200
    assert get_res.json()["temperature"] == 0.85
    assert get_res.json()["system_prompt"] == "You are Cretivra Advanced Quality Test System."

def test_clear_conversations_endpoint(client):
    reg = client.post("/api/auth/register", json={
        "email": "tester_settings_conv@cretivra.ai",
        "password": "password123",
        "full_name": "Settings Conv Tester"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Create conversation first
    c_res = client.post("/api/conversations", json={"title": "To be cleared", "model_id": "cretivra-1"}, headers=headers)
    assert c_res.status_code == 201

    # Verify it exists
    l_res = client.get("/api/conversations", headers=headers)
    assert len(l_res.json()["conversations"]) >= 1

    # Clear all conversations
    del_res = client.post("/api/settings/clear-conversations", headers=headers)
    assert del_res.status_code == 200
    assert "cleared successfully" in del_res.json()["message"]

    # Verify empty
    l_res_after = client.get("/api/conversations", headers=headers)
    assert len(l_res_after.json()["conversations"]) == 0
