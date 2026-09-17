import re
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.user import UserRole


def normalize_phone(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = re.sub(r"[^0-9+]", "", str(value)).strip()
    if not cleaned:
        return None
    if cleaned.startswith("+91"):
        return cleaned
    if len(cleaned) >= 10 and cleaned.startswith("9"):
        return f"+91{cleaned}"
    return cleaned


class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.CUSTOMER
    phone: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    location_name: Optional[str] = "Chennai Central"
    latitude: Optional[float] = 13.0827
    longitude: Optional[float] = 80.2707
    experience_years: Optional[float] = 1.0

    @field_validator("phone", "mobile_number", mode="before")
    @classmethod
    def normalize_contact(cls, value):
        return normalize_phone(value)

    @model_validator(mode="after")
    def ensure_contact_details(self):
        contact = self.phone or self.mobile_number
        if not contact:
            raise ValueError("A valid mobile number or phone number is required")
        return self

    @model_validator(mode="after")
    def ensure_address_fields(self):
        if not self.address:
            return self
        address = self.address
        required_fields = ["house_flat_number", "street_name", "area", "city", "district", "state", "pincode"]
        missing = [field for field in required_fields if not str(address.get(field, "")).strip()]
        if missing:
            raise ValueError(f"Address is missing required fields: {', '.join(missing)}")
        return self


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
