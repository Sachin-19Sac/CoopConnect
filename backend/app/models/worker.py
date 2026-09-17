import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class WorkerAvailabilityEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"

class VerificationStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"

class SkillLevelEnum(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    experience_years = Column(Float, default=1.0, nullable=False)
    experience_level = Column(Enum(SkillLevelEnum), default=SkillLevelEnum.INTERMEDIATE, nullable=False)
    latitude = Column(Float, nullable=False)  # Chennai demo coords
    longitude = Column(Float, nullable=False)
    location_name = Column(String(100), default="Chennai Central", nullable=False)
    availability = Column(Enum(WorkerAvailabilityEnum), default=WorkerAvailabilityEnum.AVAILABLE, nullable=False)
    verification_status = Column(Enum(VerificationStatusEnum), default=VerificationStatusEnum.VERIFICATION_REQUIRED, nullable=False)
    daily_capacity = Column(Integer, default=5, nullable=False)
    bio = Column(String(500), nullable=True)
    profile_photo = Column(String(255), nullable=True)
    primary_skill = Column(String(100), nullable=True)
    additional_skills = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="worker_profile")
    skills = relationship("WorkerSkill", back_populates="worker", cascade="all, delete-orphan")
    certifications = relationship("WorkerCertification", back_populates="worker", cascade="all, delete-orphan")
    assigned_bookings = relationship("Booking", back_populates="assigned_worker", foreign_keys="Booking.assigned_worker_id")
    ratings_received = relationship("Rating", back_populates="worker", foreign_keys="Rating.worker_id")
    allocation_records = relationship("AllocationResult", back_populates="worker")
    emergency_requests = relationship("EmergencyRequest", back_populates="responder", foreign_keys="EmergencyRequest.responding_worker_id")
    work_photo_submissions = relationship("WorkPhotoSubmission", back_populates="worker")

class WorkerSkill(Base):
    __tablename__ = "worker_skills"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    experience_years = Column(Float, default=1.0, nullable=False)
    skill_level = Column(Enum(SkillLevelEnum), default=SkillLevelEnum.INTERMEDIATE, nullable=False)
    verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    worker = relationship("Worker", back_populates="skills")
    skill = relationship("Skill", back_populates="worker_skills")

class WorkerCertification(Base):
    __tablename__ = "worker_certifications"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    issuing_org = Column(String(150), nullable=False)
    credential_id = Column(String(100), nullable=True)
    issue_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    worker = relationship("Worker", back_populates="certifications")
