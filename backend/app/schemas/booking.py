from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from app.models.booking import BookingStatusEnum, PaymentMethodEnum, PaymentStatusEnum, FeedbackStatusEnum
from app.schemas.user import UserOut
from app.schemas.service import ServiceOut, SkillOut


class BookingCreate(BaseModel):
    service_id: int
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    booking_date: str # YYYY-MM-DD
    booking_time: str # e.g. "10:00 AM"
    notes: Optional[str] = None
    service_address: Optional[Dict[str, Any]] = None
    payment_method: PaymentMethodEnum = PaymentMethodEnum.CASH
    payment_status: PaymentStatusEnum = PaymentStatusEnum.PENDING
    selected_worker_id: Optional[int] = None

    @field_validator("location_name")
    @classmethod
    def validate_location(cls, value: str):
        if not value or not value.strip():
            raise ValueError("location_name is required")
        return value.strip()

    @field_validator("booking_date", "booking_time")
    @classmethod
    def validate_booking_window(cls, value: str):
        if not value or not str(value).strip():
            raise ValueError("booking date and time are required")
        return str(value).strip()

    @model_validator(mode="after")
    def validate_service_address(self):
        address = self.service_address
        if not address:
            return self
        required_fields = ["full_name", "mobile_number", "house_flat_number", "street_name", "area", "city", "district", "state", "pincode"]
        missing = [field for field in required_fields if not str(address.get(field, "")).strip()]
        if missing:
            raise ValueError(f"service_address is missing required fields: {', '.join(missing)}")
        return self

class RatingCreate(BaseModel):
    rating_score: float = Field(ge=1, le=5) # 1.0 to 5.0
    feedback: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("feedback")
    @classmethod
    def trim_feedback(cls, value):
        return value.strip() if value is not None else value

class WorkerAssignmentRequest(BaseModel):
    worker_id: int

class RatingOut(BaseModel):
    id: int
    rating_score: float
    feedback: Optional[str] = None
    created_at: datetime
    customer: Optional[UserOut] = None

    class Config:
        from_attributes = True

class CandidateScore(BaseModel):
    worker_id: int
    worker_name: str
    skill_score: float
    workload_score: float
    availability_score: float
    distance_score: float
    certification_score: float
    final_score: float
    is_selected: bool
    candidate_rank: int
    selection_reason: str
    distance_km: float
    skills: List[str] = []
    worker_experience_years: Optional[float] = None
    worker_average_rating: Optional[float] = None
    completed_service_count: Optional[int] = None
    worker_bio: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    customer_id: int
    service_id: int
    required_skill_id: int
    location_name: str
    latitude: float
    longitude: float
    booking_date: str
    booking_time: str
    status: BookingStatusEnum
    assigned_worker_id: Optional[int] = None
    notes: Optional[str] = None
    service_address: Optional[Dict[str, Any]] = None
    payment_method: Optional[PaymentMethodEnum] = None
    payment_status: Optional[PaymentStatusEnum] = None
    payment_reference: Optional[str] = None
    feedback_status: Optional[FeedbackStatusEnum] = None
    final_amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    customer: Optional[UserOut] = None
    service: Optional[ServiceOut] = None
    required_skill: Optional[SkillOut] = None
    assigned_worker: Optional[dict] = None
    rating: Optional[RatingOut] = None
    candidates: List[CandidateScore] = []

    class Config:
        from_attributes = True
