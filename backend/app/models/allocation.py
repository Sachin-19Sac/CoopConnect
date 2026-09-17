from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class AllocationResult(Base):
    __tablename__ = "allocation_results"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    
    # 5 Core factors (0 - 100)
    skill_score = Column(Float, nullable=False)        # 35% weight
    workload_score = Column(Float, nullable=False)     # 25% weight
    availability_score = Column(Float, nullable=False) # 20% weight
    distance_score = Column(Float, nullable=False)     # 10% weight
    certification_score = Column(Float, nullable=False)# 10% weight
    
    final_score = Column(Float, nullable=False)        # Total 0 - 100
    is_selected = Column(Boolean, default=False, nullable=False)
    candidate_rank = Column(Integer, default=1, nullable=False)
    selection_reason = Column(Text, nullable=False)
    score_breakdown_json = Column(Text, nullable=True) # Detailed JSON
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    booking = relationship("Booking", back_populates="allocation_results")
    worker = relationship("Worker", back_populates="allocation_records")
