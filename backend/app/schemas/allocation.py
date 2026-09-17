from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.booking import CandidateScore

class AllocationInspectionOut(BaseModel):
    booking_id: int
    service_name: str
    skill_name: str
    location_name: str
    booking_date: str
    booking_time: str
    status: str
    selected_worker: Optional[CandidateScore] = None
    all_candidates: List[CandidateScore] = []
    total_candidates_evaluated: int = 0
    weights: dict = {
        "skill": 0.35,
        "workload": 0.25,
        "availability": 0.20,
        "distance": 0.10,
        "certification": 0.10
    }
