import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

class UserVerificationStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    WORKER = "WORKER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    phone = Column(String(20), nullable=True)
    mobile_number = Column(String(20), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    verification_status = Column(Enum(UserVerificationStatusEnum), default=UserVerificationStatusEnum.VERIFICATION_REQUIRED, nullable=False)
    verification_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    worker_profile = relationship("Worker", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer", foreign_keys="Booking.customer_id")
    ratings_given = relationship("Rating", back_populates="customer", foreign_keys="Rating.customer_id")
    emergency_requests = relationship("EmergencyRequest", back_populates="customer", foreign_keys="EmergencyRequest.customer_id")
    work_photo_reviews = relationship("WorkPhotoSubmission", back_populates="reviewer", foreign_keys="WorkPhotoSubmission.reviewed_by_id")
