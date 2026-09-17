import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.service import Service
from app.models.worker import Worker
from app.models.booking import Booking, BookingStatusEnum, BookingStatusHistory, Rating
from app.models.allocation import AllocationResult
from app.schemas.booking import BookingCreate, BookingOut, RatingCreate, RatingOut, CandidateScore
from app.utils.auth import get_current_user, require_role
from app.utils.geo import CHENNAI_HUBS
from app.services.allocation.engine import FairAllocationEngine

router = APIRouter(prefix="/bookings", tags=["Customer Bookings"])

def serialize_booking(b: Booking, db: Session) -> dict:
    alloc_records = db.query(AllocationResult).filter(AllocationResult.booking_id == b.id).all()
    candidates = []
    for a in alloc_records:
        candidates.append(CandidateScore(
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
            distance_km=0.0,
            skills=[skill.skill.name for skill in a.worker.skills if skill.skill] if a.worker else [],
        ))
    
    assigned_worker_data = None
    if b.assigned_worker:
        w = b.assigned_worker
        assigned_worker_data = {
            "id": w.id,
            "name": w.user.name if w.user else "Worker",
            "phone": w.user.phone if w.user else None,
            "experience_years": w.experience_years,
            "location_name": w.location_name,
            "verification_status": w.verification_status.value,
            "skills": [skill.skill.name for skill in w.skills if skill.skill],
        }

    parsed_service_address = None
    if b.service_address:
        try:
            parsed_service_address = json.loads(b.service_address)
        except (TypeError, ValueError):
            parsed_service_address = {"raw_address": b.service_address}

    return {
        "id": b.id,
        "customer_id": b.customer_id,
        "service_id": b.service_id,
        "required_skill_id": b.required_skill_id,
        "location_name": b.location_name,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "booking_date": b.booking_date,
        "booking_time": b.booking_time,
        "status": b.status,
        "assigned_worker_id": b.assigned_worker_id,
        "notes": b.notes,
        "service_address": parsed_service_address,
        "payment_method": b.payment_method.value if b.payment_method else None,
        "payment_status": b.payment_status.value if b.payment_status else None,
        "payment_reference": b.payment_reference,
        "feedback_status": b.feedback_status.value if b.feedback_status else None,
        "final_amount": b.final_amount,
        "created_at": b.created_at,
        "updated_at": b.updated_at,
        "customer": b.customer,
        "service": b.service,
        "required_skill": b.required_skill,
        "assigned_worker": assigned_worker_data,
        "rating": b.rating,
        "candidates": candidates
    }

@router.post("", response_model=BookingOut)
def create_booking(
    req: BookingCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == req.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Selected service not found")

    # Resolve coordinates from Chennai Hubs if not provided
    lat = req.latitude
    lng = req.longitude
    if not lat or not lng:
        hub = CHENNAI_HUBS.get(req.location_name, CHENNAI_HUBS["Anna Nagar"])
        lat = hub["lat"]
        lng = hub["lng"]

    if req.service_address is None:
        req.service_address = {
            "full_name": current_user.name,
            "mobile_number": current_user.mobile_number or current_user.phone or "",
            "house_flat_number": "",
            "street_name": "",
            "area": "",
            "city": req.location_name or "Chennai",
            "district": "Chennai",
            "state": "Tamil Nadu",
            "pincode": "",
            "additional_instructions": req.notes or ""
        }

    booking = Booking(
        customer_id=current_user.id,
        service_id=service.id,
        required_skill_id=service.required_skill_id,
        location_name=req.location_name,
        latitude=lat,
        longitude=lng,
        booking_date=req.booking_date,
        booking_time=req.booking_time,
        status=BookingStatusEnum.PENDING,
        notes=req.notes,
        service_address=json.dumps(req.service_address) if isinstance(req.service_address, dict) else req.service_address,
        payment_method=req.payment_method,
        payment_status=req.payment_status,
        final_amount=service.base_price
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Initial Status History
    h = BookingStatusHistory(
        booking_id=booking.id,
        status=BookingStatusEnum.PENDING,
        notes="Booking created by customer. Initiating Fair Work Allocation Engine."
    )
    db.add(h)
    db.commit()

    # Respect the worker selected by the customer. Admin callers may still use
    # the legacy automatic allocation behavior when no worker is supplied.
    assigned_worker = FairAllocationEngine.allocate_booking(
        db,
        booking,
        preferred_worker_id=req.selected_worker_id,
    )
    if req.selected_worker_id is not None and assigned_worker is None:
        raise HTTPException(status_code=409, detail="Selected worker is no longer available for this skill")

    db.refresh(booking)
    return serialize_booking(booking, db)

@router.post("/preview", response_model=List[CandidateScore])
def preview_booking_candidates(
    req: BookingCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == req.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Selected service not found")

    lat = req.latitude
    lng = req.longitude
    if not lat or not lng:
        hub = CHENNAI_HUBS.get(req.location_name, CHENNAI_HUBS["Anna Nagar"])
        lat, lng = hub["lat"], hub["lng"]

    preview = Booking(
        customer_id=current_user.id,
        service_id=service.id,
        required_skill_id=service.required_skill_id,
        location_name=req.location_name,
        latitude=lat,
        longitude=lng,
        booking_date=req.booking_date,
        booking_time=req.booking_time,
        status=BookingStatusEnum.PENDING,
    )
    candidates = FairAllocationEngine.evaluate_candidates(db, preview)
    enriched_candidates = []
    for candidate in candidates:
        worker = db.query(Worker).filter(Worker.id == candidate["worker_id"]).first()
        completed_count = db.query(Booking).filter(
            Booking.assigned_worker_id == candidate["worker_id"],
            Booking.status.in_([BookingStatusEnum.COMPLETED, BookingStatusEnum.RATED]),
        ).count()
        average_rating = db.query(func.avg(Rating.rating_score)).filter(
            Rating.worker_id == candidate["worker_id"]
        ).scalar()
        enriched_candidates.append(CandidateScore(
            **candidate,
            skills=[skill.skill.name for skill in worker.skills if skill.skill] if worker else [],
            worker_experience_years=worker.experience_years if worker else None,
            worker_average_rating=round(float(average_rating), 2) if average_rating else None,
            completed_service_count=completed_count,
            worker_bio=worker.bio if worker else None,
        ))
    return enriched_candidates

@router.get("", response_model=List[BookingOut])
def list_bookings(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(Booking.customer_id == current_user.id)
    elif current_user.role == UserRole.WORKER:
        if current_user.worker_profile:
            query = query.filter(Booking.assigned_worker_id == current_user.worker_profile.id)

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    bookings = query.order_by(Booking.created_at.desc()).all()
    return [serialize_booking(b, db) for b in bookings]

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_details(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check permissions
    if current_user.role == UserRole.CUSTOMER and b.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current_user.role == UserRole.WORKER:
        if not current_user.worker_profile or b.assigned_worker_id != current_user.worker_profile.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    return serialize_booking(b, db)

@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user.role == UserRole.CUSTOMER and b.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    b.status = BookingStatusEnum.CANCELLED
    h = BookingStatusHistory(
        booking_id=b.id,
        status=BookingStatusEnum.CANCELLED,
        notes=f"Booking cancelled by {current_user.name}"
    )
    db.add(h)
    db.commit()
    return {"message": "Booking successfully cancelled", "status": "CANCELLED"}

@router.post("/{booking_id}/rating", response_model=RatingOut)
def rate_booking(
    booking_id: int,
    req: RatingCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if b.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only customer can rate this booking")
    if b.status not in (BookingStatusEnum.COMPLETED, BookingStatusEnum.RATED):
        raise HTTPException(status_code=409, detail="Only completed bookings can be rated")

    if not b.assigned_worker_id:
        raise HTTPException(status_code=400, detail="Cannot rate booking without assigned worker")

    existing_rating = db.query(Rating).filter(Rating.booking_id == b.id).first()
    if existing_rating:
        raise HTTPException(status_code=400, detail="Booking is already rated")

    rating = Rating(
        booking_id=b.id,
        customer_id=current_user.id,
        worker_id=b.assigned_worker_id,
        rating_score=req.rating_score,
        feedback=req.feedback
    )
    db.add(rating)
    b.status = BookingStatusEnum.RATED
    db.commit()
    db.refresh(rating)
    return rating
