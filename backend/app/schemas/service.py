from pydantic import BaseModel
from typing import Optional, List

class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None

class SkillOut(SkillBase):
    id: int
    category_id: int

    class Config:
        from_attributes = True

class ServiceCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    icon: str = "Wrench"

class ServiceCategoryOut(ServiceCategoryBase):
    id: int
    skills: List[SkillOut] = []

    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: int
    required_skill_id: int
    base_price: float
    estimated_duration_mins: int = 60
    active: bool = True

class ServiceOut(ServiceBase):
    id: int
    category: Optional[ServiceCategoryBase] = None
    required_skill: Optional[SkillBase] = None

    class Config:
        from_attributes = True
