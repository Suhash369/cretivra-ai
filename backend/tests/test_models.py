def test_list_models(client):
    res = client.get("/api/models")
    assert res.status_code == 200
    models = res.json()
    assert isinstance(models, list)
    assert len(models) >= 5

    # Verify Cretivra model branding is exposed, NOT raw underlying names in display
    ids = [m["id"] for m in models]
    assert "cretivra-1" in ids
    assert "cretivra-reason" in ids
    assert "cretivra-flux" in ids
    assert "cretivra-diffusion" in ids

def test_admin_update_model_mapping(client):
    payload = {
        "model_id": "cretivra-1",
        "underlying_model": "llama3.2",
        "display_name": "Cretivra 1 (Upgraded)"
    }
    res = client.patch("/api/models/cretivra-1", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["underlying_model"] == "llama3.2"
    assert data["display_name"] == "Cretivra 1 (Upgraded)"
