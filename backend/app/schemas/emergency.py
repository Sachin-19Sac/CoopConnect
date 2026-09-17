from typing import Optional, Any, Dict, List

from pydantic import BaseModel, Field

from app.models.emergency import EmergencyPriorityEnum, EmergencyStatusEnum


class EmergencyRequestCreate(BaseModel):
    requested_service: str = Field(..., min_length=1)
    service_address: Optional[Dict[str, Any]] = None
    customer_mobile: Optional[str] = None
    description: Optional[str] = None
    priority: EmergencyPriorityEnum = EmergencyPriorityEnum.URGENT
    payment_method: Optional[str] = None


class EmergencyDecision(BaseModel):
    decision: str = Field(..., pattern="^(accept|decline)$")


class EmergencyRequestOut(BaseModel):
    id: int
    customer_id: int
    requested_service: str
    service_address: Optional[Dict[str, Any]] = None
    customer_mobile: Optional[str] = None
    description: Optional[str] = None
    priority: EmergencyPriorityEnum
    payment_method: Optional[str] = None
    payment_status: str
    status: EmergencyStatusEnum
    responding_worker_id: Optional[int] = None
    admin_notes: Optional[str] = None
    notified_workers: List[int] = Field(default_factory=list)
    requested_at: str
    responded_at: Optional[str] = None
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True
