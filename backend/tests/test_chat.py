def get_auth_client_headers(client):
    res = client.post("/api/auth/register", json={
        "email": "tester_chat@cretivra.ai",
        "password": "password123",
        "full_name": "Chat Tester"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_chat_streaming(client):
    headers = get_auth_client_headers(client)
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
    headers = get_auth_client_headers(client)
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

def test_clean_ai_response_and_stream_filter():
    from app.providers.cloud_provider import clean_ai_response, StreamFilter

    # 1. Test clean_ai_response with <think> tag and planning scaffold
    raw_leaked_response = (
        "<think>\n"
        "Topic: Dengue Fever.\n"
        "Persona: Asura AI by Cretivra\n"
        "Constraints: Use GitHub-flavored Markdown\n"
        "Check: Did I use the persona? Yes.\n"
        "</think>\n"
        "# Dengue Fever: Comprehensive Clinical Overview\n\n"
        "Dengue fever is a mosquito-borne viral infection."
    )
    cleaned = clean_ai_response(raw_leaked_response)
    assert "<think>" not in cleaned
    assert "</think>" not in cleaned
    assert "Check: Did I use" not in cleaned
    assert cleaned.startswith("# Dengue Fever: Comprehensive Clinical Overview")

    # 2. Test StreamFilter with streaming chunks
    sf = StreamFilter()
    chunks = [
        "<think>\nPlanning the ",
        "response internally...\n",
        "Check: Persona verified.\n",
        "</think>\n",
        "# Quantum Computing\n\n",
        "Quantum computing harnesses qubits."
    ]

    emitted_content = []
    reasoning_events = []

    for c in chunks:
        for evt in sf.process(c):
            if evt.get("content"):
                emitted_content.append(evt["content"])
            if evt.get("reasoning_status"):
                reasoning_events.append(evt["reasoning_status"])

    for evt in sf.flush():
        if evt.get("content"):
            emitted_content.append(evt["content"])

    full_text = "".join(emitted_content)
    assert "Planning the response" not in full_text
    assert "<think>" not in full_text
    assert "</think>" not in full_text
    assert full_text.startswith("# Quantum Computing")
    assert len(reasoning_events) > 0

