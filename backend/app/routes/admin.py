import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole, UserVerificationStatusEnum
from app.models.booking import Booking, BookingStatusEnum, BookingStatusHistory
from app.models.allocation import AllocationResult
from app.models.worker import Worker
from app.schemas.analytics import AdminDashboardStats, SkillGapItem, ForecastItem, DemandByLocation, WorkerEquitySummary
from app.schemas.allocation import AllocationInspectionOut
from app.schemas.booking import CandidateScore, WorkerAssignmentRequest
from app.utils.auth import require_role
from app.services.analytics.engine import AnalyticsEngine
from app.services.forecasting.engine import DemandForecastingEngine
from app.services.allocation.engine import FairAllocationEngine


class VerificationReviewRequest(BaseModel):
    status: UserVerificationStatusEnum
    review_notes: Optional[str] = None


router = APIRouter(prefix="/admin", tags=["Admin Workforce Intelligence"])


def _serialize_user_address(address: Optional[str]) -> Optional[dict | str]:
    """Return structured addresses while preserving legacy plain-text values."""
    if not address:
        return None
    try:
        parsed = json.loads(address)
    except json.JSONDecodeError:
        return {"raw_address": address}
    return parsed


@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    stats = AnalyticsEngine.get_dashboard_summary(db)
    return stats

@router.get("/verification-queue")
def get_verification_queue(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    queue = []
    for user in db.query(User).filter(User.role.in_([UserRole.CUSTOMER, UserRole.WORKER])).all():
        if user.verification_status in {
            UserVerificationStatusEnum.PENDING,
            UserVerificationStatusEnum.UNDER_REVIEW,
            UserVerificationStatusEnum.VERIFICATION_REQUIRED,
            UserVerificationStatusEnum.REJECTED,
        }:
            worker_profile = None
            if user.worker_profile:
                worker_profile = {
                    "worker_id": user.worker_profile.id,
                    "location_name": user.worker_profile.location_name,
                    "experience_years": user.worker_profile.experience_years,
                    "primary_skill": user.worker_profile.primary_skill,
                    "verification_status": user.worker_profile.verification_status.value,
                }
            queue.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "mobile_number": user.mobile_number or user.phone,
                "verification_status": user.verification_status.value,
                "address": _serialize_user_address(user.address),
                "worker_profile": worker_profile,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            })
    return {"items": queue, "total": len(queue)}

@router.post("/verification/{user_id}/review")
def review_verification(
    user_id: int,
    req: VerificationReviewRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.verification_status = req.status
    if user.worker_profile:
        user.worker_profile.verification_status = req.status

    if req.review_notes:
        user.verification_details = json.dumps({
            "reviewed_by": current_user.name,
            "review_notes": req.review_notes,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        })

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "verification_status": user.verification_status.value,
        "review_notes": req.review_notes,
    }

@router.get("/worker-equity", response_model=WorkerEquitySummary)
def get_worker_equity(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    return AnalyticsEngine.get_worker_equity(db)

@router.get("/allocations/{booking_id}", response_model=AllocationInspectionOut)
def inspect_allocation_decision(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    alloc_records = db.query(AllocationResult).filter(AllocationResult.booking_id == booking.id).all()
    candidates = []
    selected_candidate = None

    for a in alloc_records:
        cand = CandidateScore(
            worker_id=a.worker_id,
            worker_name=a.worker.user.name if a.worker and a.worker.user else f"Worker #{a.worker_id}",
            skill_score=a.skill_score,
            workload_score=a.workload_score,
            availability_score=a.availability_score,
            distance_score=a.distance_score,
            certification_score=a.certification_score,
            final_score=a.final_score,
            is_selected=a.is_selected,
            candidate_rank=a.candidate_rank,
            selection_reason=a.selection_reason,
            distance_km=0.0
        )
        candidates.append(cand)
        if a.is_selected:
            selected_candidate = cand

    return AllocationInspectionOut(
        booking_id=booking.id,
        service_name=booking.service.name if booking.service else "Service",
        skill_name=booking.required_skill.name if booking.required_skill else "Skill",
        location_name=booking.location_name,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        status=booking.status.value,
        selected_worker=selected_candidate,
        all_candidates=candidates,
        total_candidates_evaluated=len(candidates)
    )

@router.post("/allocations/{booking_id}/worker")
def change_booking_worker(
    booking_id: int,
    req: WorkerAssignmentRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status in [BookingStatusEnum.COMPLETED, BookingStatusEnum.RATED, BookingStatusEnum.CANCELLED]:
        raise HTTPException(status_code=409, detail="Completed, rated, or cancelled bookings cannot be reassigned")

    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    assigned_worker = FairAllocationEngine.allocate_booking(
        db,
        booking,
        preferred_worker_id=req.worker_id,
    )
    if assigned_worker is None:
        raise HTTPException(status_code=409, detail="Worker is unavailable, unverified, or does not have the required skill")

    history = BookingStatusHistory(
        booking_id=booking.id,
        status=BookingStatusEnum.WORKER_ASSIGNED,
        notes=f"Admin reassigned booking to {worker.user.name if worker.user else f'Worker #{worker.id}'}.",
    )
    db.add(history)
    db.commit()
    db.refresh(booking)
    return {"message": "Booking worker updated", "booking_id": booking.id, "worker_id": booking.assigned_worker_id}

@router.get("/skill-gaps", response_model=List[SkillGapItem])
def get_skill_gaps(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    return AnalyticsEngine.compute_skill_gaps(db)

@router.get("/forecast", response_model=List[ForecastItem])
def get_forecasts(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    return DemandForecastingEngine.generate_service_forecasts(db)

@router.get("/heatmap", response_model=List[DemandByLocation])
def get_heatmap(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    return AnalyticsEngine.get_demand_heatmap(db)

@router.get("/analytics")
def get_full_analytics(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    summary = AnalyticsEngine.get_dashboard_summary(db)
    gaps = AnalyticsEngine.compute_skill_gaps(db)
    forecasts = DemandForecastingEngine.generate_service_forecasts(db)
    heatmap = AnalyticsEngine.get_demand_heatmap(db)
    loc_forecasts = DemandForecastingEngine.get_location_forecasts(db)

    return {
        "summary": summary,
        "skill_gaps": gaps,
        "forecasts": forecasts,
        "heatmap": heatmap,
        "location_forecasts": loc_forecasts
    }
