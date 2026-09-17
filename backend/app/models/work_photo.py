import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class WorkPhotoStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class WorkPhotoSubmission(Base):
    __tablename__ = "work_photo_submissions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    before_photo_ref = Column(String(255), nullable=False)
    after_photo_ref = Column(String(255), nullable=False)
    status = Column(Enum(WorkPhotoStatus), default=WorkPhotoStatus.PENDING, nullable=False)
    admin_note = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="work_photo_submission")
    worker = relationship("Worker", back_populates="work_photo_submissions")
    reviewer = relationship("User", back_populates="work_photo_reviews", foreign_keys=[reviewed_by_id])
