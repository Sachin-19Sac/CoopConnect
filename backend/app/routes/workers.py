import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.worker import Worker, WorkerSkill, WorkerCertification, WorkerAvailabilityEnum
from app.models.booking import Booking, BookingStatusEnum, Rating
from app.models.work_photo import WorkPhotoStatus, WorkPhotoSubmission
from app.schemas.worker import WorkerOut, WorkerProfileUpdate, WorkerSkillCreate, WorkerSkillOut, WorkerCertificationCreate, WorkerCertificationOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/workers", tags=["Worker Profile & Skills Bank"])

def enrich_worker_data(w: Worker, db: Session) -> dict:
    # Active jobs count
    active_statuses = [BookingStatusEnum.WORKER_ASSIGNED, BookingStatusEnum.ACCEPTED, BookingStatusEnum.IN_PROGRESS]
    active_jobs = db.query(Booking).filter(
        Booking.assigned_worker_id == w.id,
        Booking.status.in_(active_statuses)
    ).count()

    # Average rating
    avg_rating_res = db.query(func.avg(Rating.rating_score)).filter(Rating.worker_id == w.id).scalar()
    avg_rating = round(float(avg_rating_res), 2) if avg_rating_res else 4.8

    # Utilization rate
    util_rate = min(100.0, round((active_jobs / max(w.daily_capacity, 1)) * 100, 1))

    additional_skills = []
    if w.additional_skills:
        try:
            additional_skills = json.loads(w.additional_skills)
        except (TypeError, ValueError):
            additional_skills = [w.additional_skills]

    return {
        "id": w.id,
        "user_id": w.user_id,
        "experience_years": w.experience_years,
        "experience_level": w.experience_level,
        "latitude": w.latitude,
        "longitude": w.longitude,
        "location_name": w.location_name,
        "availability": w.availability,
        "verification_status": w.verification_status,
        "daily_capacity": w.daily_capacity,
        "bio": w.bio,
        "profile_photo": w.profile_photo,
        "primary_skill": w.primary_skill,
        "additional_skills": additional_skills,
        "mobile_number": w.user.mobile_number if w.user else None,
        "user": w.user,
        "skills": w.skills,
        "certifications": w.certifications,
        "active_jobs_count": active_jobs,
        "average_rating": avg_rating,
        "utilization_rate": util_rate
    }

@router.get("", response_model=List[WorkerOut])
def list_workers(skill_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Worker)
    if skill_id:
        query = query.join(WorkerSkill).filter(WorkerSkill.skill_id == skill_id)
    workers = query.all()
    return [enrich_worker_data(w, db) for w in workers]

@router.get("/me", response_model=WorkerOut)
def get_my_worker_profile(
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    if not current_user.worker_profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return enrich_worker_data(current_user.worker_profile, db)

@router.get("/{worker_id}", response_model=WorkerOut)
def get_worker_detail(worker_id: int, db: Session = Depends(get_db)):
    w = db.query(Worker).filter(Worker.id == worker_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    return enrich_worker_data(w, db)

@router.get("/{worker_id}/reviews")
def get_worker_reviews(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return db.query(Rating).filter(Rating.worker_id == worker_id).order_by(Rating.created_at.desc()).all()

@router.get("/{worker_id}/approved-work")
def get_worker_approved_work(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    submissions = (
        db.query(WorkPhotoSubmission)
        .filter(
            WorkPhotoSubmission.worker_id == worker_id,
            WorkPhotoSubmission.status == WorkPhotoStatus.APPROVED,
        )
        .order_by(WorkPhotoSubmission.submitted_at.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "booking_id": item.booking_id,
            "before_photo_url": f"/api/work-photos/{item.id}/before",
            "after_photo_url": f"/api/work-photos/{item.id}/after",
            "submitted_at": item.submitted_at,
        }
        for item in submissions
    ]

@router.put("/profile", response_model=WorkerOut)
def update_profile(
    req: WorkerProfileUpdate,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    if not w:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    if req.experience_years is not None:
        w.experience_years = req.experience_years
    if req.experience_level is not None:
        w.experience_level = req.experience_level
    if req.location_name is not None:
        w.location_name = req.location_name
    if req.latitude is not None:
        w.latitude = req.latitude
    if req.longitude is not None:
        w.longitude = req.longitude
    if req.availability is not None:
        w.availability = req.availability
    if req.bio is not None:
        w.bio = req.bio
    if req.daily_capacity is not None:
        w.daily_capacity = req.daily_capacity
    if req.profile_photo is not None:
        w.profile_photo = req.profile_photo
    if req.primary_skill is not None:
        w.primary_skill = req.primary_skill
    if req.additional_skills is not None:
        w.additional_skills = json.dumps(req.additional_skills)
    if req.mobile_number is not None:
        current_user.mobile_number = req.mobile_number
        current_user.phone = req.mobile_number

    db.commit()
    db.refresh(w)
    return enrich_worker_data(w, db)

@router.put("/availability")
def toggle_availability(
    availability: WorkerAvailabilityEnum,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    if not w:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    w.availability = availability
    db.commit()
    return {"message": "Availability updated successfully", "availability": w.availability.value}

@router.post("/skills", response_model=WorkerSkillOut)
def add_worker_skill(
    req: WorkerSkillCreate,
    current_user: User = Depends(require_role([UserRole.WORKER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    if not w:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    # Check if skill already added
    existing = db.query(WorkerSkill).filter(
        WorkerSkill.worker_id == w.id,
        WorkerSkill.skill_id == req.skill_id
    ).first()

    if existing:
        existing.skill_level = req.skill_level
        existing.experience_years = req.experience_years
        db.commit()
        db.refresh(existing)
        return existing

    ws = WorkerSkill(
        worker_id=w.id,
        skill_id=req.skill_id,
        experience_years=req.experience_years,
        skill_level=req.skill_level,
        verified=True
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws

@router.post("/certifications", response_model=WorkerCertificationOut)
def add_certification(
    req: WorkerCertificationCreate,
    current_user: User = Depends(require_role([UserRole.WORKER, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    w = current_user.worker_profile
    if not w:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    cert = WorkerCertification(
        worker_id=w.id,
        name=req.name,
        issuing_org=req.issuing_org,
        credential_id=req.credential_id,
        issue_date=req.issue_date,
        expiry_date=req.expiry_date,
        verified=True
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert
