def test_subscription_paywall_and_activation(client):
    # 1. Register a new user
    res = client.post("/api/auth/register", json={
        "email": "payuser@cretivra.ai",
        "password": "securepass123",
        "full_name": "Pay User"
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

    # 4. Create ₹20 payment order
    res = client.post("/api/payments/create-order", json={"plan_name": "15-Day Pass"}, headers=headers)
    assert res.status_code == 200
    order_data = res.json()
    assert order_data["amount_inr"] == 20.0
    assert order_data["amount"] == 2000
    assert "order_id" in order_data

    # 5. Verify Razorpay payment
    res = client.post("/api/payments/verify-razorpay", json={
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": "pay_rzp_mock_12345"
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["is_subscribed"] is True
    assert res.json()["days_left"] == 15

    # 6. Check subscription status -> now Active with 15 days left
    res = client.get("/api/payments/status", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_subscribed"] is True
    assert res.json()["days_left"] >= 14

    # 7. Test direct UPI QR submission on another user
    res_b = client.post("/api/auth/register", json={
        "email": "upi_user@cretivra.ai",
        "password": "upipassword123",
        "full_name": "UPI User"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    res = client.post("/api/payments/submit-upi", json={
        "utr_transaction_id": "UTR892837492837",
        "upi_id": "upi_user@okaxis",
        "amount": 20.0
    }, headers=headers_b)
    assert res.status_code == 200
    assert res.json()["is_subscribed"] is True
    assert res.json()["days_left"] == 15
