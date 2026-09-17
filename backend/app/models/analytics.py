from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DemandStatistic(Base):
    __tablename__ = "demand_statistics"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    location_name = Column(String(100), nullable=False)
    period_year = Column(Integer, nullable=False)
    period_month = Column(Integer, nullable=False)
    booking_count = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    location_name = Column(String(100), nullable=False)
    forecast_period = Column(String(50), nullable=False) # e.g. "October 2026"
    predicted_demand = Column(Float, nullable=False)
    confidence_level = Column(Float, default=0.85, nullable=False)
    demand_level = Column(String(20), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH
    trend_direction = Column(String(20), default="UP", nullable=False) # UP, STABLE, DOWN
    algorithm_used = Column(String(50), default="Scikit-Learn Ridge Regression", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
