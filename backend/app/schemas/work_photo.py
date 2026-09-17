from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.work_photo import WorkPhotoStatus


class WorkPhotoSubmissionOut(BaseModel):
    id: int
    booking_id: int
    worker_id: int
    status: WorkPhotoStatus
    admin_note: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class WorkPhotoReviewRequest(BaseModel):
    status: WorkPhotoStatus
    admin_note: Optional[str] = None
