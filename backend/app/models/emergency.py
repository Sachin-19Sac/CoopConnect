import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class EmergencyPriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"
    CRITICAL = "CRITICAL"


class EmergencyStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    WORKERS_NOTIFIED = "WORKERS_NOTIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requested_service = Column(String(120), nullable=False)
    service_address = Column(Text, nullable=True)
    customer_mobile = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    priority = Column(Enum(EmergencyPriorityEnum), default=EmergencyPriorityEnum.URGENT, nullable=False)
    payment_method = Column(String(40), nullable=True)
    payment_status = Column(String(40), default="PENDING", nullable=False)
    status = Column(Enum(EmergencyStatusEnum), default=EmergencyStatusEnum.OPEN, nullable=False)
    responding_worker_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    notified_workers_json = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("User", back_populates="emergency_requests", foreign_keys=[customer_id])
    responder = relationship("Worker", back_populates="emergency_requests", foreign_keys=[responding_worker_id])
