import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class PaymentMethodEnum(str, enum.Enum):
    CASH = "CASH"
    GPAY_UPI = "GPay / UPI"
    UPI = "UPI"

class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PAYMENT_VERIFICATION_REQUIRED = "PAYMENT_VERIFICATION_REQUIRED"

class FeedbackStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    UPDATED = "UPDATED"

class BookingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    WORKER_ASSIGNED = "WORKER_ASSIGNED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    RATED = "RATED"
    CANCELLED = "CANCELLED"
    REASSIGNING = "REASSIGNING"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    required_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    location_name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    booking_date = Column(String(20), nullable=False) # e.g. "2026-09-10"
    booking_time = Column(String(20), nullable=False) # e.g. "10:00 AM"
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.PENDING, nullable=False)
    assigned_worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    notes = Column(Text, nullable=True)
    service_address = Column(Text, nullable=True)
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.CASH, nullable=False)
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING, nullable=False)
    payment_reference = Column(String(120), nullable=True)
    feedback_status = Column(Enum(FeedbackStatusEnum), default=FeedbackStatusEnum.PENDING, nullable=False)
    final_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("User", back_populates="bookings", foreign_keys=[customer_id])
    service = relationship("Service", back_populates="bookings")
    required_skill = relationship("Skill")
    assigned_worker = relationship("Worker", back_populates="assigned_bookings", foreign_keys=[assigned_worker_id])
    allocation_results = relationship("AllocationResult", back_populates="booking", cascade="all, delete-orphan")
    rating = relationship("Rating", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    status_history = relationship("BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan")
    work_photo_submission = relationship("WorkPhotoSubmission", back_populates="booking", uselist=False, cascade="all, delete-orphan")

class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(BookingStatusEnum), nullable=False)
    notes = Column(String(255), nullable=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="status_history")

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    rating_score = Column(Float, nullable=False) # 1.0 to 5.0
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="rating")
    customer = relationship("User", back_populates="ratings_given", foreign_keys=[customer_id])
    worker = relationship("Worker", back_populates="ratings_received", foreign_keys=[worker_id])
