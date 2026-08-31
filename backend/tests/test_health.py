def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["backend"]["name"] == "CRETIVRA AI"
    assert data["database"]["status"] == "connected"
