from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    icon = Column(String(50), default="Wrench", nullable=False)

    skills = relationship("Skill", back_populates="category", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="category", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    category = relationship("ServiceCategory", back_populates="skills")
    services = relationship("Service", back_populates="required_skill")
    worker_skills = relationship("WorkerSkill", back_populates="skill")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    required_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    base_price = Column(Float, default=500.0, nullable=False)
    estimated_duration_mins = Column(Integer, default=60, nullable=False)
    active = Column(Boolean, default=True, nullable=False)

    category = relationship("ServiceCategory", back_populates="services")
    required_skill = relationship("Skill", back_populates="services")
    bookings = relationship("Booking", back_populates="service")
