import os
import secrets
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.booking import Booking, BookingStatusEnum
from app.models.user import User, UserRole
from app.models.work_photo import WorkPhotoStatus, WorkPhotoSubmission
from app.schemas.work_photo import WorkPhotoReviewRequest, WorkPhotoSubmissionOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/work-photos", tags=["Work Photos"])
PHOTO_DIR = Path(__file__).resolve().parents[2] / "uploads" / "work_photos"
MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _save_photo(upload: UploadFile) -> str:
    ext = Path(upload.filename or "").suffix.lower()
    if upload.content_type not in ALLOWED_TYPES or ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG photos are allowed")
    content = upload.file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Each photo must be 5MB or smaller")
    if not content:
        raise HTTPException(status_code=400, detail="Photo cannot be empty")
    PHOTO_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{secrets.token_urlsafe(24)}{ALLOWED_TYPES[upload.content_type]}"
    (PHOTO_DIR / name).write_bytes(content)
    return name


def _out(item: WorkPhotoSubmission, include_urls: bool = False) -> dict:
    result = WorkPhotoSubmissionOut.model_validate(item).model_dump()
    if include_urls:
        result["before_photo_url"] = f"{settings.API_PREFIX}/work-photos/{item.id}/before"
        result["after_photo_url"] = f"{settings.API_PREFIX}/work-photos/{item.id}/after"
    return result


@router.post("/bookings/{booking_id}", response_model=WorkPhotoSubmissionOut)
def upload_work_photos(
    booking_id: int,
    before_photo: UploadFile = File(...),
    after_photo: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db),
):
    worker = current_user.worker_profile
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.assigned_worker_id == (worker.id if worker else -1)).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Assigned booking not found")
    if booking.status not in (BookingStatusEnum.COMPLETED, BookingStatusEnum.RATED):
        raise HTTPException(status_code=409, detail="Photos can only be submitted after the booking is completed")
    existing = db.query(WorkPhotoSubmission).filter_by(booking_id=booking.id).first()
    if existing and existing.status != WorkPhotoStatus.REJECTED:
        raise HTTPException(status_code=409, detail="This booking already has a photo submission")
    before_ref = _save_photo(before_photo)
    try:
        after_ref = _save_photo(after_photo)
    except Exception:
        (PHOTO_DIR / before_ref).unlink(missing_ok=True)
        raise
    if existing:
        existing.before_photo_ref, existing.after_photo_ref = before_ref, after_ref
        existing.status = WorkPhotoStatus.PENDING
        existing.admin_note = None
        existing.reviewed_by_id, existing.reviewed_at = None, None
        existing.submitted_at = datetime.utcnow()
        item = existing
    else:
        item = WorkPhotoSubmission(booking_id=booking.id, worker_id=worker.id, before_photo_ref=before_ref, after_photo_ref=after_ref)
        db.add(item)
    db.commit()
    db.refresh(item)
    return _out(item)


@router.get("/worker", response_model=List[WorkPhotoSubmissionOut])
def worker_submissions(current_user: User = Depends(require_role([UserRole.WORKER])), db: Session = Depends(get_db)):
    worker = current_user.worker_profile
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return [_out(x) for x in db.query(WorkPhotoSubmission).filter_by(worker_id=worker.id).order_by(WorkPhotoSubmission.submitted_at.desc()).all()]


@router.get("/bookings/{booking_id}", response_model=WorkPhotoSubmissionOut)
def customer_submission(booking_id: int, current_user: User = Depends(require_role([UserRole.CUSTOMER])), db: Session = Depends(get_db)):
    item = db.query(WorkPhotoSubmission).join(Booking).filter(Booking.id == booking_id, Booking.customer_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Photo submission not found")
    if item.status != WorkPhotoStatus.APPROVED:
        raise HTTPException(status_code=404, detail="Approved photos are not available")
    return _out(item, include_urls=True)


@router.get("/customer", response_model=List[WorkPhotoSubmissionOut])
def customer_submissions(current_user: User = Depends(require_role([UserRole.CUSTOMER])), db: Session = Depends(get_db)):
    items = (
        db.query(WorkPhotoSubmission)
        .join(Booking)
        .filter(
            Booking.customer_id == current_user.id,
            WorkPhotoSubmission.status == WorkPhotoStatus.APPROVED,
        )
        .order_by(WorkPhotoSubmission.submitted_at.desc())
        .all()
    )
    return [_out(item, include_urls=True) for item in items]


@router.get("/admin/submissions", response_model=List[WorkPhotoSubmissionOut])
def admin_submissions(current_user: User = Depends(require_role([UserRole.ADMIN])), db: Session = Depends(get_db)):
    return [_out(x, include_urls=True) for x in db.query(WorkPhotoSubmission).join(Booking).filter(Booking.status.in_([BookingStatusEnum.COMPLETED, BookingStatusEnum.RATED])).order_by(WorkPhotoSubmission.submitted_at.desc()).all()]


@router.get("/admin", response_model=List[WorkPhotoSubmissionOut])
def admin_submissions_alias(current_user: User = Depends(require_role([UserRole.ADMIN])), db: Session = Depends(get_db)):
    return admin_submissions(current_user, db)


@router.patch("/admin/submissions/{submission_id}", response_model=WorkPhotoSubmissionOut)
def review_submission(submission_id: int, req: WorkPhotoReviewRequest, current_user: User = Depends(require_role([UserRole.ADMIN])), db: Session = Depends(get_db)):
    if req.status not in (WorkPhotoStatus.APPROVED, WorkPhotoStatus.REJECTED):
        raise HTTPException(status_code=400, detail="Review status must be APPROVED or REJECTED")
    item = db.query(WorkPhotoSubmission).filter_by(id=submission_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Photo submission not found")
    item.status, item.admin_note, item.reviewed_by_id, item.reviewed_at = req.status, (req.admin_note.strip() if req.admin_note else None), current_user.id, datetime.utcnow()
    db.commit()
    db.refresh(item)
    return _out(item, include_urls=True)


@router.post("/{submission_id}/review", response_model=WorkPhotoSubmissionOut)
def review_submission_alias(submission_id: int, req: WorkPhotoReviewRequest, current_user: User = Depends(require_role([UserRole.ADMIN])), db: Session = Depends(get_db)):
    return review_submission(submission_id, req, current_user, db)


@router.get("/{submission_id}/{photo_type}")
def get_photo(submission_id: int, photo_type: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if photo_type not in ("before", "after"):
        raise HTTPException(status_code=404, detail="Photo not found")
    item = db.query(WorkPhotoSubmission).filter_by(id=submission_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Photo not found")
    allowed = current_user.role == UserRole.ADMIN or (
        current_user.role == UserRole.CUSTOMER and item.status == WorkPhotoStatus.APPROVED and item.booking.customer_id == current_user.id
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized to view this photo")
    filename = item.before_photo_ref if photo_type == "before" else item.after_photo_ref
    path = PHOTO_DIR / Path(filename).name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Photo file not found")
    return FileResponse(path)
