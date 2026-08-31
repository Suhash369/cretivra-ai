def test_chat_streaming(client):
    payload = {
        "message": "Explain quantum computing briefly.",
        "model_id": "cretivra-1"
    }
    res = client.post("/api/chat/stream", json=payload)
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    content = res.text
    assert "data:" in content

def test_message_editing_and_regeneration(client):
    # Create conversation and add messages
    c_res = client.post("/api/conversations", json={"title": "Original Chat"})
    conv_id = c_res.json()["id"]

    # Stream a chat turn
    s_res = client.post("/api/chat/stream", json={"conversation_id": conv_id, "message": "First message"})
    assert s_res.status_code == 200

    # Fetch messages
    m_res = client.get(f"/api/conversations/{conv_id}/messages")
    msgs = m_res.json()
    assert len(msgs) >= 2

    user_msg_id = msgs[0]["id"]
    assistant_msg_id = msgs[1]["id"]

    # Test regenerating assistant message first
    regen_res = client.post(f"/api/messages/{assistant_msg_id}/regenerate")
    assert regen_res.status_code == 200

    # Test editing user message
    edit_res = client.patch(f"/api/messages/{user_msg_id}", json={"message": "Edited message prompt"})
    assert edit_res.status_code == 200
