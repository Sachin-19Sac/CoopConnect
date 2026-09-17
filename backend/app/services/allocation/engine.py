import json
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.worker import Worker, WorkerSkill, WorkerCertification, WorkerAvailabilityEnum, VerificationStatusEnum, SkillLevelEnum
from app.models.booking import Booking, BookingStatusEnum, BookingStatusHistory
from app.models.allocation import AllocationResult
from app.utils.geo import calculate_haversine_distance

class FairAllocationEngine:
    """
    Fair Work Allocation Engine:
    Skill Match = 35%
    Workload Balance = 25%
    Availability = 20%
    Distance = 10%
    Certification = 10%
    """
    WEIGHT_SKILL = 0.35
    WEIGHT_WORKLOAD = 0.25
    WEIGHT_AVAILABILITY = 0.20
    WEIGHT_DISTANCE = 0.10
    WEIGHT_CERTIFICATION = 0.10

    @classmethod
    def calculate_skill_score(cls, worker_skill: Optional[WorkerSkill]) -> float:
        if not worker_skill:
            return 0.0
        
        base_scores = {
            SkillLevelEnum.EXPERT: 95.0,
            SkillLevelEnum.ADVANCED: 85.0,
            SkillLevelEnum.INTERMEDIATE: 70.0,
            SkillLevelEnum.BEGINNER: 50.0,
        }
        base = base_scores.get(worker_skill.skill_level, 60.0)
        
        # Experience bonus up to +5 points
        exp_bonus = min(5.0, worker_skill.experience_years * 0.5)
        
        # Verification bonus
        verif_bonus = 5.0 if worker_skill.verified else 0.0
        
        return min(100.0, round(base + exp_bonus + verif_bonus, 1))

    @classmethod
    def calculate_workload_score(cls, active_jobs_count: int, daily_capacity: int = 5) -> float:
        """
        Lower active workload produces higher workload score to prevent burnout
        and ensure fair opportunity distribution.
        """
        if active_jobs_count <= 0:
            return 100.0
        
        # 1 job = 85, 2 jobs = 70, 3 jobs = 55, 4 jobs = 40, 5+ jobs = 20
        penalty = active_jobs_count * 15.0
        score = max(10.0, 100.0 - penalty)
        return round(score, 1)

    @classmethod
    def calculate_availability_score(cls, worker: Worker) -> float:
        if worker.availability == WorkerAvailabilityEnum.AVAILABLE:
            return 100.0
        return 0.0

    @classmethod
    def calculate_distance_score(cls, distance_km: float) -> float:
        """
        Haversine distance normalized:
        Within 3 km = 100
        10 km = ~70
        20 km = ~40
        > 30 km = 10
        """
        if distance_km <= 3.0:
            return 100.0
        score = max(10.0, 100.0 - ((distance_km - 3.0) * 3.5))
        return round(score, 1)

    @classmethod
    def calculate_certification_score(cls, certifications: List[WorkerCertification]) -> float:
        if not certifications:
            return 20.0 # Base for uncertified but skilled
        
        has_verified = any(c.verified for c in certifications)
        if has_verified:
            return 100.0
        return 60.0

    @classmethod
    def evaluate_candidates(
        cls,
        db: Session,
        booking: Booking,
        excluded_worker_ids: Optional[List[int]] = None
    ) -> List[dict]:
        excluded_worker_ids = excluded_worker_ids or []
        required_skill_id = booking.required_skill_id

        # 1. Query workers who possess the required skill
        candidate_skills = (
            db.query(WorkerSkill)
            .join(Worker, WorkerSkill.worker_id == Worker.id)
            .filter(WorkerSkill.skill_id == required_skill_id)
            .filter(Worker.availability == WorkerAvailabilityEnum.AVAILABLE)
            .filter(Worker.verification_status == VerificationStatusEnum.VERIFIED)
            .filter(~Worker.id.in_(excluded_worker_ids))
            .all()
        )

        results = []

        # Get active job counts for all candidates in one query
        active_statuses = [BookingStatusEnum.WORKER_ASSIGNED, BookingStatusEnum.ACCEPTED, BookingStatusEnum.IN_PROGRESS]
        workload_query = (
            db.query(Booking.assigned_worker_id, func.count(Booking.id))
            .filter(Booking.status.in_(active_statuses))
            .group_by(Booking.assigned_worker_id)
            .all()
        )
        workload_map = {worker_id: count for worker_id, count in workload_query if worker_id is not None}

        for ws in candidate_skills:
            worker = ws.worker
            if not worker:
                continue

            active_jobs = workload_map.get(worker.id, 0)
            
            # Calculate distance
            dist_km = calculate_haversine_distance(
                booking.latitude, booking.longitude,
                worker.latitude, worker.longitude
            )

            # Scores
            s_skill = cls.calculate_skill_score(ws)
            s_workload = cls.calculate_workload_score(active_jobs, worker.daily_capacity)
            s_avail = cls.calculate_availability_score(worker)
            s_dist = cls.calculate_distance_score(dist_km)
            s_cert = cls.calculate_certification_score(worker.certifications)

            # Weighted sum
            final_score = (
                (s_skill * cls.WEIGHT_SKILL) +
                (s_workload * cls.WEIGHT_WORKLOAD) +
                (s_avail * cls.WEIGHT_AVAILABILITY) +
                (s_dist * cls.WEIGHT_DISTANCE) +
                (s_cert * cls.WEIGHT_CERTIFICATION)
            )
            final_score = round(final_score, 1)

            # Reasons
            reasons = []
            if s_skill >= 85:
                reasons.append("Exact advanced/expert skill match")
            elif s_skill >= 70:
                reasons.append("Qualified skill match")
            
            if s_cert >= 90:
                reasons.append("Verified professional certification")
            
            if s_avail >= 90:
                reasons.append("Available at requested time")
            else:
                reasons.append("Currently marked unavailable")
                
            if active_jobs <= 2:
                reasons.append("Low active workload (fair opportunity distribution)")
            elif active_jobs >= 4:
                reasons.append("Higher existing workload")
                
            if dist_km <= 5.0:
                reasons.append(f"Close proximity ({dist_km} km)")
            else:
                reasons.append(f"Acceptable distance ({dist_km} km)")

            selection_reason_text = " • ".join(reasons)

            breakdown = {
                "skill": {"score": s_skill, "weight": 35, "weighted": round(s_skill * 0.35, 1)},
                "workload": {"score": s_workload, "weight": 25, "weighted": round(s_workload * 0.25, 1), "active_jobs": active_jobs},
                "availability": {"score": s_avail, "weight": 20, "weighted": round(s_avail * 0.20, 1)},
                "distance": {"score": s_dist, "weight": 10, "weighted": round(s_dist * 0.10, 1), "distance_km": dist_km},
                "certification": {"score": s_cert, "weight": 10, "weighted": round(s_cert * 0.10, 1)},
            }

            results.append({
                "worker_id": worker.id,
                "worker_name": worker.user.name if worker.user else f"Worker #{worker.id}",
                "skill_score": s_skill,
                "workload_score": s_workload,
                "availability_score": s_avail,
                "distance_score": s_dist,
                "certification_score": s_cert,
                "final_score": final_score,
                "distance_km": dist_km,
                "selection_reason": selection_reason_text,
                "score_breakdown_json": json.dumps(breakdown),
                "is_available": worker.availability == WorkerAvailabilityEnum.AVAILABLE,
            })

        # All candidates are qualified and on duty after the query filters.
        results.sort(key=lambda x: x["final_score"], reverse=True)
        for idx, item in enumerate(results):
            item["candidate_rank"] = idx + 1
            item["is_selected"] = idx == 0

        return results

    @classmethod
    def allocate_booking(
        cls,
        db: Session,
        booking: Booking,
        excluded_worker_ids: Optional[List[int]] = None,
        preferred_worker_id: Optional[int] = None
    ) -> Optional[Worker]:
        candidates = cls.evaluate_candidates(db, booking, excluded_worker_ids)
        
        # Clear previous allocation results for this booking if re-evaluating
        db.query(AllocationResult).filter(AllocationResult.booking_id == booking.id).delete()

        if not candidates:
            booking.status = BookingStatusEnum.PENDING
            booking.assigned_worker_id = None
            db.commit()
            return None

        if preferred_worker_id is not None:
            preferred = next((candidate for candidate in candidates if candidate["worker_id"] == preferred_worker_id), None)
            if preferred is None:
                booking.status = BookingStatusEnum.PENDING
                booking.assigned_worker_id = None
                db.commit()
                return None
            candidates.remove(preferred)
            candidates.insert(0, preferred)
            for idx, candidate in enumerate(candidates):
                candidate["candidate_rank"] = idx + 1
                candidate["is_selected"] = idx == 0

        # Save all evaluated candidate results for complete transparency & auditability
        selected_candidate = None
        for c in candidates:
            alloc_record = AllocationResult(
                booking_id=booking.id,
                worker_id=c["worker_id"],
                skill_score=c["skill_score"],
                workload_score=c["workload_score"],
                availability_score=c["availability_score"],
                distance_score=c["distance_score"],
                certification_score=c["certification_score"],
                final_score=c["final_score"],
                is_selected=c["is_selected"],
                candidate_rank=c["candidate_rank"],
                selection_reason=c["selection_reason"],
                score_breakdown_json=c["score_breakdown_json"],
            )
            db.add(alloc_record)
            if c["is_selected"]:
                selected_candidate = c

        if selected_candidate:
            booking.assigned_worker_id = selected_candidate["worker_id"]
            booking.status = BookingStatusEnum.WORKER_ASSIGNED
            
            # Log history
            history = BookingStatusHistory(
                booking_id=booking.id,
                status=BookingStatusEnum.WORKER_ASSIGNED,
                notes=f"Fair Allocation selected {selected_candidate['worker_name']} (Score: {selected_candidate['final_score']}/100)"
            )
            db.add(history)
            db.commit()
            return db.query(Worker).filter(Worker.id == selected_candidate["worker_id"]).first()
        else:
            booking.status = BookingStatusEnum.PENDING
            booking.assigned_worker_id = None
            db.commit()
            return None

    @classmethod
    def handle_worker_rejection(cls, db: Session, booking: Booking, rejecting_worker_id: int) -> Optional[Worker]:
        """
        When a worker rejects a job, record the reassignment event,
        blacklist the rejecting worker for this booking, and rerun the allocation engine.
        """
        history = BookingStatusHistory(
            booking_id=booking.id,
            status=BookingStatusEnum.REASSIGNING,
            notes=f"Worker #{rejecting_worker_id} declined. Triggering Fair Reallocation Engine."
        )
        db.add(history)
        booking.status = BookingStatusEnum.REASSIGNING
        db.commit()

        # Find all previously rejected worker IDs for this booking from status history
        rejections = (
            db.query(BookingStatusHistory)
            .filter(BookingStatusHistory.booking_id == booking.id)
            .filter(BookingStatusHistory.status == BookingStatusEnum.REASSIGNING)
            .all()
        )
        excluded_ids = [rejecting_worker_id]

        new_worker = cls.allocate_booking(db, booking, excluded_worker_ids=excluded_ids)
        return new_worker
