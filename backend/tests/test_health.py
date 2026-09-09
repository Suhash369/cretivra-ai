from app.core.config import settings

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["backend"]["name"] == settings.PROJECT_NAME
    assert data["database"]["status"] == "connected"
