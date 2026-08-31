def get_subscribed_client_headers(client):
    res = client.post("/api/auth/register", json={
        "email": "tester_chat@cretivra.ai",
        "password": "password123",
        "full_name": "Chat Tester"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    # Activate subscription
    client.post("/api/payments/submit-upi", json={
        "utr_transaction_id": "TEST_UTR_123456"
    }, headers=headers)
    return headers

def test_chat_streaming(client):
    headers = get_subscribed_client_headers(client)
    payload = {
        "message": "Explain quantum computing briefly.",
        "model_id": "cretivra-1"
    }
    res = client.post("/api/chat/stream", json=payload, headers=headers)
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]
    content = res.text
    assert "data:" in content

def test_message_editing_and_regeneration(client):
    headers = get_subscribed_client_headers(client)
    # Create conversation and add messages
    c_res = client.post("/api/conversations", json={"title": "Original Chat"}, headers=headers)
    conv_id = c_res.json()["id"]

    # Stream a chat turn
    s_res = client.post("/api/chat/stream", json={"conversation_id": conv_id, "message": "First message"}, headers=headers)
    assert s_res.status_code == 200

    # Fetch messages
    m_res = client.get(f"/api/conversations/{conv_id}/messages", headers=headers)
    msgs = m_res.json()
    assert len(msgs) >= 2

    user_msg_id = msgs[0]["id"]
    assistant_msg_id = msgs[1]["id"]

    # Test regenerating assistant message first
    regen_res = client.post(f"/api/messages/{assistant_msg_id}/regenerate", headers=headers)
    assert regen_res.status_code == 200

    # Test editing user message
    edit_res = client.patch(f"/api/messages/{user_msg_id}", json={"message": "Edited message prompt"}, headers=headers)
    assert edit_res.status_code == 200
