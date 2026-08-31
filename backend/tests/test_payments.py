def test_realtime_upi_paywall_and_verification(client):
    # 1. Register a new user
    res = client.post("/api/auth/register", json={
        "email": "payuser_real@cretivra.ai",
        "password": "securepass123",
        "full_name": "Real Pay User"
    })
    assert res.status_code == 201
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check initial subscription status -> should be False / Expired
    res = client.get("/api/payments/status", headers=headers)
    assert res.status_code == 200
    status_data = res.json()
    assert status_data["is_subscribed"] is False
    assert status_data["days_left"] == 0

    # 3. Try to chat without subscription -> 402 Payment Required
    res = client.post("/api/chat/stream", json={"message": "Hello AI", "model_id": "cretivra-1"}, headers=headers)
    assert res.status_code == 402
    assert "₹20 for 15 Days" in res.json()["detail"]

    # 4. Create real-time UPI Order (locked to suhashsugi369-1@oksbi, ₹20.00)
    res = client.post("/api/payments/create-upi-order", json={"plan_name": "15-Day Pass"}, headers=headers)
    assert res.status_code == 200
    order_data = res.json()
    assert order_data["amount_inr"] == 20.0
    assert order_data["upi_id"] == "suhashsugi369-1@oksbi"
    assert order_data["merchant_name"] == "SUHASH MAHADEVA"
    assert "CV20_" in order_data["order_id"]
    assert "upi://pay?" in order_data["upi_intent_url"]
    order_id = order_data["order_id"]

    # 5. Check order status before payment -> status == "pending"
    res = client.get(f"/api/payments/check-order/{order_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "pending"
    assert res.json()["is_subscribed"] is False

    # 6. Verify UPI payment with genuine 12-digit UTR
    res = client.post("/api/payments/verify-upi", json={
        "order_id": order_id,
        "utr_number": "428392817263",
        "upi_id": "suhashsugi369-1@oksbi",
        "amount": 20.0
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["is_subscribed"] is True
    assert res.json()["days_left"] == 15
    assert res.json()["utr_id"] == "428392817263"

    # 7. Check order status after payment -> status == "completed", is_subscribed == True
    res = client.get(f"/api/payments/check-order/{order_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
    assert res.json()["is_subscribed"] is True

    # 8. Check subscription status -> now Active with 15 days
    res = client.get("/api/payments/status", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_subscribed"] is True
    assert res.json()["days_left"] >= 14

    # 9. Anti-fraud check: Prevent duplicate reuse of same UTR
    res_fraud = client.post("/api/payments/verify-upi", json={
        "order_id": order_id,
        "utr_number": "428392817263",
        "amount": 20.0
    }, headers=headers)
    assert res_fraud.status_code == 400
    assert "already been redeemed" in res_fraud.json()["detail"]
