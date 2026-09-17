from pydantic import BaseModel
from typing import List, Optional

class SkillGapItem(BaseModel):
    skill_id: int
    skill_name: str
    category_name: str
    expected_monthly_demand: int
    available_monthly_capacity: int
    shortage_units: int
    severity: str # NORMAL, MODERATE, CRITICAL
    recommendation: str
    qualified_workers_count: int

class DemandByLocation(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    booking_count: int
    worker_count: int = 0
    demand_intensity: str # LOW, MEDIUM, HIGH

class DemandByService(BaseModel):
    service_id: int
    service_name: str
    category_name: str
    booking_count: int
    growth_rate: float

class ForecastItem(BaseModel):
    service_id: int
    service_name: str
    category_name: str
    location_name: Optional[str] = "All Chennai"
    forecast_month: str # e.g. "October 2026"
    predicted_bookings: int
    demand_level: str # LOW, MEDIUM, HIGH
    trend: str # UP, STABLE, DOWN
    confidence: float
    historical_trend: List[int] = []

class AdminDashboardStats(BaseModel):
    total_workers: int
    available_workers: int
    total_customers: int
    todays_bookings: int
    completed_jobs: int
    pending_jobs: int
    average_system_rating: float
    average_allocation_score: float
    workforce_utilization_percent: float
    top_skill_gaps: List[SkillGapItem] = []
    ai_recommendations: List[str] = []

class WorkerEquityItem(BaseModel):
    worker_id: int
    worker_name: str
    skills: List[str] = []
    assigned_jobs: int
    active_jobs: int
    completed_jobs: int
    utilization_percent: float
    eligible: bool
    equity_score: float
    status: str

class WorkerEquitySummary(BaseModel):
    total_workers: int
    eligible_workers: int
    average_workload: float
    most_utilized_worker: Optional[str] = None
    under_utilized_workers: int
    overloaded_workers: int
    overall_equity_score: float
    workers: List[WorkerEquityItem] = []
