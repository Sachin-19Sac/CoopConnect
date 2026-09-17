from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.service import ServiceCategory, Skill, Service
from app.schemas.service import ServiceCategoryOut, SkillOut, ServiceOut

router = APIRouter(tags=["Services & Skills Catalog"])

@router.get("/categories", response_model=List[ServiceCategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(ServiceCategory).all()

@router.get("/skills", response_model=List[SkillOut])
def get_skills(category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Skill)
    if category_id:
        query = query.filter(Skill.category_id == category_id)
    return query.all()

@router.get("/services", response_model=List[ServiceOut])
def get_services(category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Service).filter(Service.active == True)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    return query.all()

@router.get("/services/{service_id}", response_model=ServiceOut)
def get_service_detail(service_id: int, db: Session = Depends(get_db)):
    srv = db.query(Service).filter(Service.id == service_id).first()
    if not srv:
        raise HTTPException(status_code=404, detail="Service not found")
    return srv
