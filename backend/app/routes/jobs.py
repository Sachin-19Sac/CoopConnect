from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatusEnum, BookingStatusHistory
from app.schemas.booking import BookingOut
from app.utils.auth import get_current_user, require_role
from app.routes.bookings import serialize_booking
from app.services.allocation.engine import FairAllocationEngine

router = APIRouter(prefix="/jobs", tags=["Worker Job Dispatch Operations"])

@router.get("/assigned", response_model=List[BookingOut])
def get_assigned_jobs(
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    if not w:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    jobs = (
        db.query(Booking)
        .filter(Booking.assigned_worker_id == w.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [serialize_booking(j, db) for j in jobs]

@router.post("/{booking_id}/accept")
def accept_job(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.assigned_worker_id == w.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Assigned job not found")

    b.status = BookingStatusEnum.ACCEPTED
    h = BookingStatusHistory(
        booking_id=b.id,
        status=BookingStatusEnum.ACCEPTED,
        notes=f"Job accepted by worker {current_user.name}"
    )
    db.add(h)
    db.commit()
    return {"message": "Job accepted successfully", "status": "ACCEPTED"}

@router.post("/{booking_id}/reject")
def reject_job(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.assigned_worker_id == w.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Assigned job not found")

    # ⭐ Trigger Reallocation Engine
    new_worker = FairAllocationEngine.handle_worker_rejection(db, b, w.id)
    
    new_worker_name = new_worker.user.name if new_worker and new_worker.user else "Next Available Candidate"
    return {
        "message": f"Job declined. Fair Allocation Engine automatically reassigned to: {new_worker_name}",
        "status": b.status.value,
        "new_assigned_worker_id": b.assigned_worker_id
    }

@router.post("/{booking_id}/start")
def start_job(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.assigned_worker_id == w.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Job not found")

    b.status = BookingStatusEnum.IN_PROGRESS
    h = BookingStatusHistory(
        booking_id=b.id,
        status=BookingStatusEnum.IN_PROGRESS,
        notes=f"Worker {current_user.name} started working on the job"
    )
    db.add(h)
    db.commit()
    return {"message": "Job marked as IN_PROGRESS", "status": "IN_PROGRESS"}

@router.post("/{booking_id}/complete")
def complete_job(
    booking_id: int,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.assigned_worker_id == w.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Job not found")

    b.status = BookingStatusEnum.COMPLETED
    h = BookingStatusHistory(
        booking_id=b.id,
        status=BookingStatusEnum.COMPLETED,
        notes=f"Worker {current_user.name} completed the service successfully"
    )
    db.add(h)
    db.commit()
    return {"message": "Job marked as COMPLETED. Customer prompted for rating.", "status": "COMPLETED"}
