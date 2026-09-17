import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.database import get_db
from app.models.user import User, UserRole
from app.models.worker import Worker, WorkerAvailabilityEnum, VerificationStatusEnum
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token, get_current_user

class CustomerProfileUpdate(BaseModel):
    mobile_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    hashed_pwd = get_password_hash(req.password)
    normalized_mobile = req.mobile_number or req.phone
    new_user = User(
        name=req.name,
        email=req.email.lower(),
        password_hash=hashed_pwd,
        role=req.role,
        phone=req.phone or normalized_mobile,
        mobile_number=normalized_mobile,
        address=json.dumps(req.address) if req.address else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If role is WORKER, create worker profile
    if req.role == UserRole.WORKER:
        worker = Worker(
            user_id=new_user.id,
            experience_years=req.experience_years or 1.0,
            latitude=req.latitude or 13.0827,
            longitude=req.longitude or 80.2707,
            location_name=req.location_name or "Chennai Central",
            availability=WorkerAvailabilityEnum.AVAILABLE,
            verification_status=VerificationStatusEnum.VERIFIED
        )
        db.add(worker)
        db.commit()

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role.value,
            "phone": new_user.phone,
            "mobile_number": new_user.mobile_number,
            "address": json.loads(new_user.address) if new_user.address else None,
            "verification_status": new_user.verification_status.value if new_user.verification_status else None
        }
    }

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "phone": user.phone,
            "mobile_number": user.mobile_number,
            "address": json.loads(user.address) if user.address else None,
            "verification_status": user.verification_status.value if user.verification_status else None
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    worker_data = None
    if current_user.role == UserRole.WORKER and current_user.worker_profile:
        worker_data = {
            "worker_id": current_user.worker_profile.id,
            "availability": current_user.worker_profile.availability.value,
            "location_name": current_user.worker_profile.location_name,
            "experience_years": current_user.worker_profile.experience_years,
            "experience_level": current_user.worker_profile.experience_level.value if current_user.worker_profile.experience_level else None,
            "verification_status": current_user.worker_profile.verification_status.value,
            "mobile_number": current_user.mobile_number or current_user.phone,
            "primary_skill": current_user.worker_profile.primary_skill,
            "additional_skills": json.loads(current_user.worker_profile.additional_skills) if current_user.worker_profile.additional_skills else []
        }

    address_data = None
    if current_user.address:
        try:
            address_data = json.loads(current_user.address)
        except (TypeError, ValueError):
            address_data = {"raw_address": current_user.address}

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "phone": current_user.phone,
        "mobile_number": current_user.mobile_number or current_user.phone,
        "address": address_data,
        "avatar_url": current_user.avatar_url,
        "verification_status": current_user.verification_status.value if current_user.verification_status else None,
        "worker_profile": worker_data
    }

@router.put("/profile")
def update_customer_profile(
    req: CustomerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.phone is not None:
        current_user.phone = req.phone
    if req.mobile_number is not None:
        current_user.mobile_number = req.mobile_number
        current_user.phone = req.mobile_number
    if req.address is not None:
        current_user.address = json.dumps(req.address)

    db.commit()
    db.refresh(current_user)
    return get_me(current_user, db)
