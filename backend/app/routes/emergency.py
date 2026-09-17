import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.emergency import EmergencyRequest, EmergencyStatusEnum
from app.models.user import User, UserRole
from app.models.worker import Worker, VerificationStatusEnum, WorkerAvailabilityEnum
from app.schemas.emergency import EmergencyDecision, EmergencyRequestCreate, EmergencyRequestOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/emergency", tags=["Emergency Services"])


def _as_dict(value: Optional[Any]) -> Optional[Dict[str, Any]]:
    if value in (None, ""):
        return None
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            return {"raw_address": value}
    return value


def _serialize_emergency_request(item: EmergencyRequest) -> Dict[str, Any]:
    return {
        "id": item.id,
        "customer_id": item.customer_id,
        "requested_service": item.requested_service,
        "service_address": _as_dict(item.service_address),
        "customer_mobile": item.customer_mobile,
        "description": item.description,
        "priority": item.priority.value if item.priority else None,
        "payment_method": item.payment_method,
        "payment_status": item.payment_status,
        "status": item.status.value if item.status else None,
        "responding_worker_id": item.responding_worker_id,
        "admin_notes": item.admin_notes,
        "notified_workers": json.loads(item.notified_workers_json) if item.notified_workers_json else [],
        "requested_at": item.requested_at.isoformat() if item.requested_at else None,
        "responded_at": item.responded_at.isoformat() if item.responded_at else None,
        "completed_at": item.completed_at.isoformat() if item.completed_at else None,
    }


@router.post("/requests", response_model=EmergencyRequestOut)
def create_emergency_request(
    req: EmergencyRequestCreate,
    current_user: User = Depends(require_role([UserRole.CUSTOMER])),
    db: Session = Depends(get_db),
):
    if not req.requested_service or not req.requested_service.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested service is required")

    address_value = req.service_address or _as_dict(current_user.address) or {}
    customer_mobile = req.customer_mobile or current_user.mobile_number or current_user.phone
    if not customer_mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile number is required for emergency requests")

    duplicate = (
        db.query(EmergencyRequest)
        .filter(
            EmergencyRequest.customer_id == current_user.id,
            EmergencyRequest.requested_service == req.requested_service.strip(),
            EmergencyRequest.status.in_([EmergencyStatusEnum.OPEN, EmergencyStatusEnum.WORKERS_NOTIFIED]),
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active emergency request already exists: ER-{duplicate.id:06d}",
        )

    candidate_workers = []
    for worker in db.query(Worker).all():
        if worker.user is None:
            continue
        if worker.availability != WorkerAvailabilityEnum.AVAILABLE:
            continue
        if worker.verification_status != VerificationStatusEnum.VERIFIED:
            continue
        try:
            additional_skills = json.loads(worker.additional_skills) if worker.additional_skills else []
        except (TypeError, ValueError):
            additional_skills = [worker.additional_skills]
        text = f"{worker.primary_skill or ''} {' '.join(additional_skills)}".lower()
        service_text = req.requested_service.lower()
        if service_text in text or any(part.lower() in text for part in service_text.split()):
            candidate_workers.append(worker.id)

    emergency = EmergencyRequest(
        customer_id=current_user.id,
        requested_service=req.requested_service.strip(),
        service_address=json.dumps(address_value) if isinstance(address_value, dict) else (address_value or None),
        customer_mobile=customer_mobile,
        description=req.description,
        priority=req.priority,
        payment_method=req.payment_method,
        status=EmergencyStatusEnum.WORKERS_NOTIFIED if candidate_workers else EmergencyStatusEnum.OPEN,
        notified_workers_json=json.dumps(candidate_workers),
    )

    db.add(emergency)
    db.commit()
    db.refresh(emergency)
    return EmergencyRequestOut(**_serialize_emergency_request(emergency))


@router.post("/requests/{request_id}/cancel", response_model=EmergencyRequestOut)
def cancel_emergency_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency request not found")
    if current_user.role != UserRole.ADMIN and emergency.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot cancel this emergency request")
    if emergency.status in [EmergencyStatusEnum.COMPLETED, EmergencyStatusEnum.CANCELLED]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Emergency request is already closed")

    emergency.status = EmergencyStatusEnum.CANCELLED
    emergency.admin_notes = f"Cancelled by {current_user.role.value.lower()}."
    db.commit()
    db.refresh(emergency)
    return EmergencyRequestOut(**_serialize_emergency_request(emergency))


@router.get("/requests", response_model=List[EmergencyRequestOut])
def list_emergency_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(EmergencyRequest)

    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(EmergencyRequest.customer_id == current_user.id)
    elif current_user.role == UserRole.WORKER:
        if not current_user.worker_profile:
            return []
        query = query.filter(
            (EmergencyRequest.responding_worker_id == current_user.worker_profile.id)
            | (EmergencyRequest.responding_worker_id.is_(None))
        )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    items = query.order_by(EmergencyRequest.requested_at.desc()).all()
    if current_user.role == UserRole.WORKER and current_user.worker_profile:
        worker_id = current_user.worker_profile.id
        items = [
            item for item in items
            if worker_id in (json.loads(item.notified_workers_json) if item.notified_workers_json else [])
        ]
    return [EmergencyRequestOut(**_serialize_emergency_request(item)) for item in items]


@router.post("/requests/{request_id}/respond", response_model=EmergencyRequestOut)
def respond_to_emergency_request(
    request_id: int,
    decision: EmergencyDecision,
    current_user: User = Depends(require_role([UserRole.WORKER])),
    db: Session = Depends(get_db),
):
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not emergency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency request not found")

    if not current_user.worker_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Worker profile not found")

    notified_workers = json.loads(emergency.notified_workers_json) if emergency.notified_workers_json else []
    worker = current_user.worker_profile
    if worker.id not in notified_workers:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This emergency request is not assigned to your notification queue")
    if worker.availability != WorkerAvailabilityEnum.AVAILABLE or worker.verification_status != VerificationStatusEnum.VERIFIED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Worker is not eligible for emergency response")

    decision_value = decision.decision.lower()
    if decision_value == "accept":
        updated = (
            db.query(EmergencyRequest)
            .filter(
                EmergencyRequest.id == request_id,
                EmergencyRequest.responding_worker_id.is_(None),
                EmergencyRequest.status.in_([EmergencyStatusEnum.OPEN, EmergencyStatusEnum.WORKERS_NOTIFIED]),
            )
            .update(
                {
                    EmergencyRequest.responding_worker_id: worker.id,
                    EmergencyRequest.status: EmergencyStatusEnum.ASSIGNED,
                    EmergencyRequest.responded_at: datetime.utcnow(),
                    EmergencyRequest.admin_notes: f"Accepted by worker #{worker.id} ({current_user.name}).",
                },
                synchronize_session=False,
            )
        )
        if updated != 1:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This emergency request is no longer available")
    elif decision_value == "decline":
        emergency.admin_notes = f"Declined by worker #{worker.id} ({current_user.name})."
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported decision")

    db.commit()
    db.refresh(emergency)
    return EmergencyRequestOut(**_serialize_emergency_request(emergency))
