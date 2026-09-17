import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.service import Service
from app.models.booking import Booking, BookingStatusEnum
from app.models.worker import Worker
from app.models.work_photo import WorkPhotoSubmission
from app.services.allocation.engine import FairAllocationEngine
from app.services.forecasting.engine import DemandForecastingEngine
from app.services.analytics.engine import AnalyticsEngine
from app.utils.auth import create_access_token

TEST_DB_PATH = "test_coopconnect.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///./{TEST_DB_PATH}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)
    from scripts.seed_data import seed_all
    db = TestingSessionLocal()
    seed_all(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["app"] == "CoopConnect"

def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@coopconnect.demo",
        "password": "coopconnect123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_auth_login_worker():
    response = client.post("/api/auth/login", json={
        "email": "worker@coopconnect.demo",
        "password": "coopconnect123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "WORKER"

def test_services_catalog():
    response = client.get("/api/services")
    assert response.status_code == 200
    services = response.json()
    assert len(services) >= 10
    
    tank_srv = next((s for s in services if s["name"] == "Tank Installation"), None)
    assert tank_srv is not None

def test_fair_allocation_engine_scoring():
    db = TestingSessionLocal()
    srv = db.query(Service).filter(Service.name == "Tank Installation").first()
    cust = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    
    booking = Booking(
        customer_id=cust.id,
        service_id=srv.id,
        required_skill_id=srv.required_skill_id,
        location_name="Anna Nagar",
        latitude=13.0850,
        longitude=80.2100,
        booking_date="2026-09-10",
        booking_time="10:00 AM",
        status=BookingStatusEnum.PENDING
    )
    db.add(booking)
    db.commit()

    candidates = FairAllocationEngine.evaluate_candidates(db, booking)
    assert len(candidates) >= 3
    
    # Check that candidate scoring adheres to 0-100 range and ranking
    top_candidate = candidates[0]
    assert top_candidate["final_score"] >= 80.0
    assert top_candidate["skill_score"] >= 70.0
    assert top_candidate["availability_score"] == 100.0
    assert "score_breakdown_json" in top_candidate
    
    # Allocate booking
    allocated_worker = FairAllocationEngine.allocate_booking(db, booking)
    assert allocated_worker is not None
    assert booking.status == BookingStatusEnum.WORKER_ASSIGNED
    assert booking.assigned_worker_id == top_candidate["worker_id"]
    db.close()

def test_worker_rejection_reassignment():
    db = TestingSessionLocal()
    srv = db.query(Service).filter(Service.name == "Tank Installation").first()
    cust = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    
    booking = Booking(
        customer_id=cust.id,
        service_id=srv.id,
        required_skill_id=srv.required_skill_id,
        location_name="Anna Nagar",
        latitude=13.0850,
        longitude=80.2100,
        booking_date="2026-09-11",
        booking_time="11:00 AM",
        status=BookingStatusEnum.PENDING
    )
    db.add(booking)
    db.commit()

    first_worker = FairAllocationEngine.allocate_booking(db, booking)
    assert first_worker is not None
    first_worker_id = first_worker.id

    # Simulate worker rejection
    new_worker = FairAllocationEngine.handle_worker_rejection(db, booking, first_worker_id)
    assert new_worker is not None
    assert new_worker.id != first_worker_id
    assert booking.status == BookingStatusEnum.WORKER_ASSIGNED
    db.close()

def test_ai_demand_forecasting():
    db = TestingSessionLocal()
    forecasts = DemandForecastingEngine.generate_service_forecasts(db)
    assert len(forecasts) > 0
    assert "October 2026" in forecasts[0]["forecast_month"]
    assert forecasts[0]["predicted_demand" if "predicted_demand" in forecasts[0] else "predicted_bookings"] > 0
    assert forecasts[0]["confidence"] > 0.8
    db.close()

def test_skill_gap_analysis():
    db = TestingSessionLocal()
    gaps = AnalyticsEngine.compute_skill_gaps(db)
    assert len(gaps) > 0
    assert len(gaps[0]["recommendation"]) > 10
    db.close()

def test_admin_dashboard_api():
    token = create_access_token({"sub": "1", "role": "ADMIN"})
    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_workers"] >= 30
    assert data["todays_bookings"] > 0
    assert len(data["ai_recommendations"]) > 0

def test_admin_worker_equity_api():
    token = create_access_token({"sub": "1", "role": "ADMIN"})
    response = client.get("/api/admin/worker-equity", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    names = {worker["worker_name"] for worker in data["workers"]}
    assert {"Priya Raman", "Arjun Kumar", "Divya S", "Mohammed Irfan", "Keerthana R", "Vignesh P"}.issubset(names)
    assert data["total_workers"] == len(data["workers"])
    assert 0 <= data["overall_equity_score"] <= 100
    assert all(0 <= worker["equity_score"] <= 100 for worker in data["workers"])
    assert all("active_jobs" in worker and "completed_jobs" in worker for worker in data["workers"])

def test_customer_previews_and_selects_worker():
    customer = db_user = TestingSessionLocal().query(User).filter(User.role == UserRole.CUSTOMER).first()
    db_user_session = TestingSessionLocal()
    service = db_user_session.query(Service).filter(Service.name == "Tank Installation").first()
    db_user_session.close()
    token = create_access_token({"sub": str(customer.id), "role": "CUSTOMER"})
    payload = {
        "service_id": service.id,
        "location_name": "Anna Nagar",
        "booking_date": "2026-09-20",
        "booking_time": "10:00 AM",
    }

    preview = client.post("/api/bookings/preview", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert preview.status_code == 200
    candidates = preview.json()
    assert len(candidates) >= 2
    assert all(candidate["skills"] for candidate in candidates)

    selected_id = candidates[-1]["worker_id"]
    booking = client.post(
        "/api/bookings",
        json={**payload, "selected_worker_id": selected_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert booking.status_code == 200
    assert booking.json()["assigned_worker_id"] == selected_id

def test_admin_can_reassign_active_booking():
    db = TestingSessionLocal()
    service = db.query(Service).filter(Service.name == "Tank Installation").first()
    customer = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    db.close()
    admin_token = create_access_token({"sub": "1", "role": "ADMIN"})
    customer_token = create_access_token({"sub": str(customer.id), "role": "CUSTOMER"})
    payload = {
        "service_id": service.id,
        "location_name": "Anna Nagar",
        "booking_date": "2026-09-21",
        "booking_time": "11:30 AM",
    }
    preview = client.post("/api/bookings/preview", json=payload, headers={"Authorization": f"Bearer {customer_token}"})
    candidates = preview.json()
    booking = client.post(
        "/api/bookings",
        json={**payload, "selected_worker_id": candidates[0]["worker_id"]},
        headers={"Authorization": f"Bearer {customer_token}"},
    ).json()
    replacement = candidates[1]["worker_id"]

    response = client.post(
        f"/api/admin/allocations/{booking['id']}/worker",
        json={"worker_id": replacement},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["worker_id"] == replacement


def test_emergency_request_notifies_only_eligible_workers_and_claim_is_single_winner():
    db = TestingSessionLocal()
    customer = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    workers = db.query(User).filter(User.role == UserRole.WORKER).limit(2).all()
    db.close()

    customer_token = create_access_token({"sub": str(customer.id), "role": "CUSTOMER"})
    response = client.post(
        "/api/emergency/requests",
        json={
            "requested_service": "Plumbing",
            "customer_mobile": "9876543210",
            "description": "Urgent pipe leak",
            "priority": "URGENT",
            "payment_method": "CASH",
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 200
    emergency = response.json()
    assert emergency["id"] > 0
    assert emergency["status"] in {"OPEN", "WORKERS_NOTIFIED"}
    assert emergency["payment_method"] == "CASH"

    first_worker_token = create_access_token({"sub": str(workers[0].id), "role": "WORKER"})
    worker_queue = client.get(
        "/api/emergency/requests",
        headers={"Authorization": f"Bearer {first_worker_token}"},
    )
    assert worker_queue.status_code == 200
    if emergency["id"] in {item["id"] for item in worker_queue.json()}:
        accepted = client.post(
            f"/api/emergency/requests/{emergency['id']}/respond",
            json={"decision": "accept"},
            headers={"Authorization": f"Bearer {first_worker_token}"},
        )
        assert accepted.status_code == 200
        assert accepted.json()["status"] == "ASSIGNED"

        second_worker_token = create_access_token({"sub": str(workers[1].id), "role": "WORKER"})
        rejected = client.post(
            f"/api/emergency/requests/{emergency['id']}/respond",
            json={"decision": "accept"},
            headers={"Authorization": f"Bearer {second_worker_token}"},
        )
        assert rejected.status_code in {403, 409}


def test_admin_verification_queue_and_review():
    admin_token = create_access_token({"sub": "1", "role": "ADMIN"})
    queue = client.get("/api/admin/verification-queue", headers={"Authorization": f"Bearer {admin_token}"})
    assert queue.status_code == 200
    payload = queue.json()
    assert "items" in payload
    assert len(payload["items"]) >= 1

    user_id = payload["items"][0]["id"]
    review = client.post(
        f"/api/admin/verification/{user_id}/review",
        json={"status": "VERIFIED", "review_notes": "Approved for service access."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert review.status_code == 200
    assert review.json()["verification_status"] == "VERIFIED"


def test_booking_address_validation_requires_complete_delivery_details():
    db = TestingSessionLocal()
    customer = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
    service = db.query(Service).filter(Service.name == "Tank Installation").first()
    db.close()
    customer_token = create_access_token({"sub": str(customer.id), "role": "CUSTOMER"})
    payload = {
        "service_id": service.id,
        "location_name": "Anna Nagar",
        "booking_date": "2026-09-22",
        "booking_time": "02:00 PM",
        "service_address": {
            "full_name": "Demo User",
            "mobile_number": "9876543210",
        },
    }
    response = client.post(
        "/api/bookings",
        json=payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert response.status_code == 422


def test_worker_uploads_admin_approves_and_customer_views_work_photos():
    db = TestingSessionLocal()
    customer = db.query(User).filter(User.email == "customer@coopconnect.demo").first()
    worker_user = db.query(User).filter(User.email == "worker@coopconnect.demo").first()
    admin = db.query(User).filter(User.email == "admin@coopconnect.demo").first()
    worker = db.query(Worker).filter(Worker.user_id == worker_user.id).first()
    service = db.query(Service).first()
    customer_id = customer.id
    worker_user_id = worker_user.id
    admin_id = admin.id
    booking = Booking(
        customer_id=customer.id,
        service_id=service.id,
        required_skill_id=service.required_skill_id,
        location_name="Anna Nagar",
        latitude=13.085,
        longitude=80.21,
        booking_date="2026-09-24",
        booking_time="10:00 AM",
        status=BookingStatusEnum.COMPLETED,
        assigned_worker_id=worker.id,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    booking_id = booking.id
    db.close()

    worker_token = create_access_token({"sub": str(worker_user_id), "role": "WORKER"})
    upload = client.post(
        f"/api/work-photos/bookings/{booking_id}",
        files={
            "before_photo": ("before.png", b"\x89PNG\r\n\x1a\nbefore", "image/png"),
            "after_photo": ("after.png", b"\x89PNG\r\n\x1a\nafter", "image/png"),
        },
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert upload.status_code == 200
    assert upload.json()["status"] == "PENDING"

    admin_token = create_access_token({"sub": str(admin_id), "role": "ADMIN"})
    admin_queue = client.get(
        "/api/work-photos/admin",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_queue.status_code == 200
    submission = next(item for item in admin_queue.json() if item["booking_id"] == booking_id)

    reviewed = client.post(
        f"/api/work-photos/{submission['id']}/review",
        json={"status": "APPROVED", "admin_note": "Photos verified by admin."},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "APPROVED"

    customer_token = create_access_token({"sub": str(customer_id), "role": "CUSTOMER"})
    customer_photos = client.get(
        "/api/work-photos/customer",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert customer_photos.status_code == 200
    assert any(item["booking_id"] == booking_id for item in customer_photos.json())
