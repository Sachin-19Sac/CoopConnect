from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.worker import WorkerAvailabilityEnum, VerificationStatusEnum, SkillLevelEnum
from app.schemas.user import UserOut
from app.schemas.service import SkillOut

class WorkerSkillCreate(BaseModel):
    skill_id: int
    experience_years: float = 1.0
    skill_level: SkillLevelEnum = SkillLevelEnum.INTERMEDIATE

class WorkerSkillOut(BaseModel):
    id: int
    skill_id: int
    experience_years: float
    skill_level: SkillLevelEnum
    verified: bool
    skill: Optional[SkillOut] = None

    class Config:
        from_attributes = True

class WorkerCertificationCreate(BaseModel):
    name: str
    issuing_org: str
    credential_id: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class WorkerCertificationOut(BaseModel):
    id: int
    name: str
    issuing_org: str
    credential_id: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    verified: bool

    class Config:
        from_attributes = True

class WorkerProfileUpdate(BaseModel):
    experience_years: Optional[float] = None
    experience_level: Optional[SkillLevelEnum] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: Optional[WorkerAvailabilityEnum] = None
    bio: Optional[str] = None
    daily_capacity: Optional[int] = None
    profile_photo: Optional[str] = None
    primary_skill: Optional[str] = None
    additional_skills: Optional[List[str]] = None
    mobile_number: Optional[str] = None

class WorkerOut(BaseModel):
    id: int
    user_id: int
    experience_years: float
    experience_level: Optional[SkillLevelEnum] = None
    latitude: float
    longitude: float
    location_name: str
    availability: WorkerAvailabilityEnum
    verification_status: VerificationStatusEnum
    daily_capacity: int
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    primary_skill: Optional[str] = None
    additional_skills: Optional[List[str]] = None
    mobile_number: Optional[str] = None
    user: Optional[UserOut] = None
    skills: List[WorkerSkillOut] = []
    certifications: List[WorkerCertificationOut] = []
    active_jobs_count: int = 0
    average_rating: float = 5.0
    utilization_rate: float = 0.0

    class Config:
        from_attributes = True
