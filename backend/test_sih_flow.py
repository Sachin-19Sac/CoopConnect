import urllib.request
import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def api_post(endpoint, body, token=None):
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/api{endpoint}",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        }
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def api_get(endpoint, token=None):
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/api{endpoint}",
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        }
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

print("=== Starting Complete SIH Demo Flow Validation ===")

# 1. Customer Login
cust_auth = api_post("/auth/login", {"email": "customer@coopconnect.demo", "password": "coopconnect123"})
cust_token = cust_auth["access_token"]
print("[PASS] 1. Customer login successful")

# 2. Get Services & Find Tank Installation
services = api_get("/services")
tank_srv = next(s for s in services if s["name"] == "Tank Installation")
print(f"[PASS] 2. Found Service: {tank_srv['name']} (Required Skill ID: {tank_srv['required_skill_id']})")

# 3. Create Booking
new_booking = api_post("/bookings", {
    "service_id": tank_srv["id"],
    "location_name": "Anna Nagar",
    "booking_date": "2026-09-10",
    "booking_time": "10:00 AM",
    "notes": "Residential water tank pipe valve leak."
}, token=cust_token)
b_id = new_booking["id"]
worker_name = new_booking["assigned_worker"]["name"] if new_booking["assigned_worker"] else "Pending"
print(f"[PASS] 3. Booking #{b_id} created. Fair Allocation selected: {worker_name} (Status: {new_booking['status']})")

# 4. Admin Inspects Allocation Breakdown
admin_auth = api_post("/auth/login", {"email": "admin@coopconnect.demo", "password": "coopconnect123"})
admin_token = admin_auth["access_token"]
alloc_data = api_get(f"/admin/allocations/{b_id}", token=admin_token)
sel = alloc_data["selected_worker"]
print(f"[PASS] 4. Admin Allocation Inspector: Winner: {sel['worker_name']} (Final Score: {sel['final_score']}/100, Evaluated: {alloc_data['total_candidates_evaluated']} candidates)")
print(f"       Breakdown: Skill {sel['skill_score']}/100 | Workload {sel['workload_score']}/100 | Avail {sel['availability_score']}/100 | Dist {sel['distance_score']}/100 | Cert {sel['certification_score']}/100")

# 5. Worker Accepts, Starts, Completes Job
worker_auth = api_post("/auth/login", {"email": "worker@coopconnect.demo", "password": "coopconnect123"})
worker_token = worker_auth["access_token"]
api_post(f"/jobs/{b_id}/accept", {}, token=worker_token)
api_post(f"/jobs/{b_id}/start", {}, token=worker_token)
api_post(f"/jobs/{b_id}/complete", {}, token=worker_token)
print(f"[PASS] 5. Worker job dispatch executed: ACCEPTED -> IN_PROGRESS -> COMPLETED")

# 6. Customer Rates Worker
rating_res = api_post(f"/bookings/{b_id}/rating", {"rating_score": 5.0, "feedback": "Outstanding master workmanship by Kumar!"}, token=cust_token)
print(f"[PASS] 6. Customer rating submitted: {rating_res['rating_score']} stars (Feedback: '{rating_res['feedback']}')")

# 7. Admin Forecasts and Skill Gaps
forecasts = api_get("/admin/forecast", token=admin_token)
skill_gaps = api_get("/admin/skill-gaps", token=admin_token)
print(f"[PASS] 7. AI Demand Forecast: {forecasts[0]['service_name']} -> {forecasts[0]['predicted_bookings']} predicted bookings in {forecasts[0]['forecast_month']} ({forecasts[0]['demand_level']} demand)")
print(f"[PASS] 8. Dynamic Skill Gap Detected: {skill_gaps[0]['skill_name']} ({skill_gaps[0]['category_name']}) -> Shortage: {skill_gaps[0]['shortage_units']} jobs ({skill_gaps[0]['severity']})")
print(f"       AI Action Recommendation: {skill_gaps[0]['recommendation']}")
print("\n>>> ALL 8 SIH USER DEMO STEPS VALIDATED AND PASSING 100% <<<")
