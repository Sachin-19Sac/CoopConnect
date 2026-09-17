from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserVerificationStatusEnum

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    avatar_url: Optional[str] = None
    address: Optional[str] = None
    verification_status: Optional[UserVerificationStatusEnum] = UserVerificationStatusEnum.VERIFICATION_REQUIRED

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    verification_details: Optional[str] = None

    class Config:
        from_attributes = True
