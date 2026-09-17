import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.worker import Worker, WorkerSkill, WorkerCertification, WorkerAvailabilityEnum, VerificationStatusEnum, SkillLevelEnum
from app.models.service import ServiceCategory, Skill, Service
from app.models.booking import Booking, BookingStatusEnum, BookingStatusHistory, Rating
from app.models.allocation import AllocationResult
from app.utils.auth import get_password_hash
from app.utils.geo import CHENNAI_HUBS
from app.services.allocation.engine import FairAllocationEngine

DEMO_PASSWORD = "coopconnect123"

def ensure_equity_demo_workers(db: Session):
    """Add the named equity demo workers without changing existing records."""
    skill_aliases = {
        "Leakage Repair": ["Leakage Repair", "Pipe Fitting"],
        "Electrical Repair": ["Switch & Socket Repair", "Fuse Box Troubleshooting"],
        "Fan & Light Fitting": ["Fan & Appliance Installation"],
        "Deep Cleaning": ["Deep Home Cleaning", "Bathroom Deep Cleaning"],
        "Full Apartment Cleaning": ["Deep Home Cleaning"],
        "Furniture Repair": ["Furniture Repair & Assembly", "Cabinet & Modular Work"],
        "Assembly": ["Furniture Repair & Assembly"],
        "Tank Installation": ["Tank Installation", "Leakage Repair"],
        "Plumbing": ["Leakage Repair", "Pipe Fitting"],
        "Appliance Repair": ["Fuse Box Troubleshooting", "Inverter & UPS Setup"],
    }
    requested_workers = [
        ("Priya Raman", "priya.raman@coopconnect.demo", ["Leakage Repair", "Plumbing"], 4.0),
        ("Arjun Kumar", "arjun.kumar@coopconnect.demo", ["Electrical Repair", "Fan & Light Fitting"], 5.0),
        ("Divya S", "divya.s@coopconnect.demo", ["Deep Cleaning", "Full Apartment Cleaning"], 3.0),
        ("Mohammed Irfan", "mohammed.irfan@coopconnect.demo", ["Furniture Repair", "Assembly"], 6.0),
        ("Keerthana R", "keerthana.r@coopconnect.demo", ["Tank Installation", "Plumbing"], 4.0),
        ("Vignesh P", "vignesh.p@coopconnect.demo", ["Electrical Repair", "Appliance Repair"], 2.0),
    ]
    skill_records = {skill.name: skill for skill in db.query(Skill).all()}
    locations = list(CHENNAI_HUBS.items())

    for index, (name, email, requested_skills, experience_years) in enumerate(requested_workers):
        existing_user = db.query(User).filter((User.email == email) | (User.name == name)).first()
        if existing_user:
            continue

        location_name, coords = locations[index % len(locations)]
        user = User(
            name=name,
            email=email,
            password_hash=get_password_hash(DEMO_PASSWORD),
            role=UserRole.WORKER,
            phone=f"+91 90000 {4100 + index}",
        )
        db.add(user)
        db.flush()
        worker = Worker(
            user_id=user.id,
            experience_years=experience_years,
            latitude=coords["lat"],
            longitude=coords["lng"],
            location_name=location_name,
            availability=WorkerAvailabilityEnum.AVAILABLE,
            verification_status=VerificationStatusEnum.VERIFIED,
            daily_capacity=5,
            bio=f"Certified cooperative worker with {experience_years:g} years of experience.",
        )
        db.add(worker)
        db.flush()

        selected_skills = []
        for requested_skill in requested_skills:
            for skill_name in skill_aliases[requested_skill]:
                skill = skill_records.get(skill_name)
                if skill and skill.id not in selected_skills:
                    db.add(WorkerSkill(
                        worker_id=worker.id,
                        skill_id=skill.id,
                        experience_years=experience_years,
                        skill_level=SkillLevelEnum.ADVANCED,
                        verified=True,
                    ))
                    selected_skills.append(skill.id)
                    break

        db.add(WorkerCertification(
            worker_id=worker.id,
            name="Certified",
            issuing_org="CoopConnect Workforce Cooperative",
            credential_id=f"CC-DEMO-{index + 1:03d}",
            verified=True,
        ))

    db.commit()

def seed_all(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        ensure_equity_demo_workers(db)
        print("Database already contains records. Skipping seed.")
        return

    print("Seeding CoopConnect database with rich data...")
    hashed_pwd = get_password_hash(DEMO_PASSWORD)

    # 1. Service Categories & Skills
    categories_data = [
        {
            "name": "Plumbing", "code": "PLUMB", "icon": "Wrench", "desc": "Water supply, drainage, fixtures & tank solutions",
            "skills": [
                ("Leakage Repair", "Repairing pipe fractures, joint leaks, and faucet drips"),
                ("Pipe Fitting", "Installation of PVC, CPVC, and copper plumbing lines"),
                ("Tank Installation", "Overhead and underground water tank fitting & valve alignment"),
                ("Drain Cleaning", "Clearing clogged sewer lines, traps, and downspouts"),
                ("Water Heater Fitting", "Geyser installation, thermostat calibration, and inlet piping")
            ],
            "services": [
                ("Leakage Repair", "Rapid emergency fix for leaking faucets, pipes, and concealed line seepage.", 450, 45, "Leakage Repair"),
                ("Pipe Fitting & Replacements", "Precision installation and rerouting of domestic water pipes.", 750, 90, "Pipe Fitting"),
                ("Tank Installation", "Complete overhead/underground water storage tank setup with float valve.", 1500, 120, "Tank Installation"),
                ("Drain Unblocking", "High pressure hydro-jetting and manual blockage clearing.", 600, 60, "Drain Cleaning"),
                ("Geyser & Water Heater Setup", "Complete mounting and leak-proof hot water line configuration.", 850, 60, "Water Heater Fitting")
            ]
        },
        {
            "name": "Electrical", "code": "ELEC", "icon": "Zap", "desc": "Wiring, appliances, panels, and emergency power",
            "skills": [
                ("Wiring & Rewiring", "Concealed and surface wiring for residential & commercial units"),
                ("Fan & Appliance Installation", "Ceiling fans, exhaust units, and decorative light mountings"),
                ("Switch & Socket Repair", "Modular switch replacement, earthing test, and socket fixing"),
                ("Fuse Box Troubleshooting", "MCB trip diagnosis, main panel repairs, and short circuit fixes"),
                ("Inverter & UPS Setup", "Backup power system sizing, battery cabling, and inverter commissioning")
            ],
            "services": [
                ("Home Electrical Wiring", "Safe end-to-end wiring with copper conduit and earthing protection.", 1200, 120, "Wiring & Rewiring"),
                ("Fan & Light Fitting", "Mounting and balancing ceiling fans and chandeliers.", 350, 30, "Fan & Appliance Installation"),
                ("Switch & Socket Replacement", "Replacement of burnt sockets with ISI-certified modular plates.", 300, 30, "Switch & Socket Repair"),
                ("MCB & Short Circuit Repair", "Immediate diagnostic inspection and breaker board restoration.", 650, 45, "Fuse Box Troubleshooting"),
                ("Inverter & Battery Setup", "Complete inverter mounting, wire gauge check, and terminal sealing.", 950, 75, "Inverter & UPS Setup")
            ]
        },
        {
            "name": "Cleaning & Sanitation", "code": "CLEAN", "icon": "Sparkles", "desc": "Deep cleaning, sanitization, and upholstery care",
            "skills": [
                ("Deep Home Cleaning", "Comprehensive scrubbing, degreasing, and sanitized vacuuming"),
                ("Kitchen Sanitization", "Chimney degreasing, slab scrubbing, and tile stain removal"),
                ("Bathroom Deep Cleaning", "Hard water scale removal, acid wash, and grout restoration"),
                ("Sofa & Mattress Shampooing", "Extraction shampooing and allergen removal for fabric furnishings"),
                ("Floor Polishing & Buffing", "Marble, granite, and vitrified tile machine buffing")
            ],
            "services": [
                ("Full Apartment Deep Clean", "Top-to-bottom scrub, dusting, and eco-friendly disinfection.", 2200, 180, "Deep Home Cleaning"),
                ("Kitchen Stain & Chimney Clean", "Intensive kitchen degreasing with food-grade sanitation.", 950, 90, "Kitchen Sanitization"),
                ("Bathroom Scale Removal", "Acid-free tile whitening and limescale removal from sanitaryware.", 600, 60, "Bathroom Deep Cleaning"),
                ("Sofa Fabric Shampooing", "Deep shampoo injection-extraction cleaning for 3-seater sofas.", 800, 60, "Sofa & Mattress Shampooing"),
                ("Floor Machine Polishing", "Rotary machine buffing for mirror shine restoration.", 1400, 120, "Floor Polishing & Buffing")
            ]
        },
        {
            "name": "Carpentry & Woodwork", "code": "CARP", "icon": "Hammer", "desc": "Custom furniture, architectural doors, and fittings",
            "skills": [
                ("Furniture Repair & Assembly", "Restoring wobbling chairs, bed joints, and flatpack assembly"),
                ("Door & Window Fitting", "Hinge alignment, planer adjustments, and teak/flush door mounting"),
                ("Cabinet & Modular Work", "Kitchen cabinet hinges, telescopic drawer channels, and shelves"),
                ("Lock Replacement", "Deadbolt, mortise lock, and safety latch installation")
            ],
            "services": [
                ("Furniture Repair & Assembly", "Structural reinforcement and precision flat-pack assembly.", 600, 60, "Furniture Repair & Assembly"),
                ("Door Alignment & Hinge Fix", "Planer adjustment to prevent dragging and creak silencing.", 450, 45, "Door & Window Fitting"),
                ("Modular Cabinet Channel Repair", "Soft-close hydraulic hinge and slider channel upgrades.", 850, 75, "Cabinet & Modular Work"),
                ("Smart Lock & Mortise Install", "High security lock installation with precise rebate chiseling.", 550, 45, "Lock Replacement")
            ]
        }
    ]

    skill_map = {}
    service_map = {}

    for cat_info in categories_data:
        cat = ServiceCategory(
            name=cat_info["name"],
            code=cat_info["code"],
            icon=cat_info["icon"],
            description=cat_info["desc"]
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)

        for s_name, s_desc in cat_info["skills"]:
            sk = Skill(category_id=cat.id, name=s_name, description=s_desc)
            db.add(sk)
            db.commit()
            db.refresh(sk)
            skill_map[s_name] = sk

        for srv_name, srv_desc, price, duration, req_skill_name in cat_info["services"]:
            req_sk = skill_map[req_skill_name]
            srv = Service(
                category_id=cat.id,
                name=srv_name,
                description=srv_desc,
                required_skill_id=req_sk.id,
                base_price=float(price),
                estimated_duration_mins=duration,
                active=True
            )
            db.add(srv)
            db.commit()
            db.refresh(srv)
            service_map[srv_name] = srv

    # 2. Key Demo Accounts
    admin_user = User(
        name="Arun Sundaram (Admin)",
        email="admin@coopconnect.demo",
        password_hash=hashed_pwd,
        role=UserRole.ADMIN,
        phone="+91 98401 23456"
    )
    db.add(admin_user)

    customer_user = User(
        name="Lakshmi Narayanan (Customer)",
        email="customer@coopconnect.demo",
        password_hash=hashed_pwd,
        role=UserRole.CUSTOMER,
        phone="+91 94440 98765"
    )
    db.add(customer_user)

    # Kumar (Plumbing star worker)
    kumar_coords = CHENNAI_HUBS["Anna Nagar"]
    kumar_user = User(
        name="Kumar Swaminathan (Worker)",
        email="worker@coopconnect.demo",
        password_hash=hashed_pwd,
        role=UserRole.WORKER,
        phone="+91 98840 55443"
    )
    db.add(kumar_user)
    db.commit()

    kumar_worker = Worker(
        user_id=kumar_user.id,
        experience_years=6.0,
        latitude=kumar_coords["lat"],
        longitude=kumar_coords["lng"],
        location_name="Anna Nagar",
        availability=WorkerAvailabilityEnum.AVAILABLE,
        verification_status=VerificationStatusEnum.VERIFIED,
        daily_capacity=5,
        bio="Licensed master plumber with 6 years experience in high-rise water pressure and storage tanks."
    )
    db.add(kumar_worker)
    db.commit()

    # Kumar's skills & certifications
    for sk_name, lvl, exp in [
        ("Tank Installation", SkillLevelEnum.EXPERT, 6.0),
        ("Leakage Repair", SkillLevelEnum.ADVANCED, 5.0),
        ("Pipe Fitting", SkillLevelEnum.ADVANCED, 5.5)
    ]:
        ws = WorkerSkill(
            worker_id=kumar_worker.id,
            skill_id=skill_map[sk_name].id,
            experience_years=exp,
            skill_level=lvl,
            verified=True
        )
        db.add(ws)

    kumar_cert = WorkerCertification(
        worker_id=kumar_worker.id,
        name="Advanced Master Plumbing Certification",
        issuing_org="Tamil Nadu Skill Development Corporation (TNSDC)",
        credential_id="TNSDC-PLUMB-2024-8849",
        issue_date=datetime(2024, 1, 15),
        expiry_date=datetime(2028, 1, 15),
        verified=True
    )
    db.add(kumar_cert)
    db.commit()

    # 3. Candidate Workers: Ravi & Mani (For the allocation showcase)
    ravi_user = User(name="Ravi Chandran", email="ravi@coopconnect.demo", password_hash=hashed_pwd, role=UserRole.WORKER, phone="+91 97890 11223")
    mani_user = User(name="Mani Maran", email="mani@coopconnect.demo", password_hash=hashed_pwd, role=UserRole.WORKER, phone="+91 98402 33445")
    db.add_all([ravi_user, mani_user])
    db.commit()

    ravi_worker = Worker(
        user_id=ravi_user.id,
        experience_years=3.0,
        latitude=CHENNAI_HUBS["Anna Nagar"]["lat"] + 0.015,
        longitude=CHENNAI_HUBS["Anna Nagar"]["lng"] + 0.018,
        location_name="Anna Nagar",
        availability=WorkerAvailabilityEnum.AVAILABLE,
        verification_status=VerificationStatusEnum.VERIFIED,
        daily_capacity=5,
        bio="Experienced plumber specializing in basic leakage and drainage."
    )
    mani_worker = Worker(
        user_id=mani_user.id,
        experience_years=4.5,
        latitude=CHENNAI_HUBS["Anna Nagar"]["lat"] + 0.008,
        longitude=CHENNAI_HUBS["Anna Nagar"]["lng"] + 0.007,
        location_name="Anna Nagar",
        availability=WorkerAvailabilityEnum.AVAILABLE,
        verification_status=VerificationStatusEnum.VERIFIED,
        daily_capacity=5,
        bio="Certified plumber with solid track record in pipe connections."
    )
    db.add_all([ravi_worker, mani_worker])
    db.commit()

    # Ravi & Mani skills
    db.add(WorkerSkill(worker_id=ravi_worker.id, skill_id=skill_map["Tank Installation"].id, experience_years=2.0, skill_level=SkillLevelEnum.INTERMEDIATE, verified=True))
    db.add(WorkerSkill(worker_id=mani_worker.id, skill_id=skill_map["Tank Installation"].id, experience_years=4.0, skill_level=SkillLevelEnum.ADVANCED, verified=True))
    db.add(WorkerCertification(worker_id=mani_worker.id, name="Plumbing Technical Associate", issuing_org="ITI Guindy", credential_id="ITI-2023-441", verified=True))
    db.commit()

    # 4. Generate 28 additional workers across all Chennai Hubs
    worker_names = [
        ("Priya Ramanathan", "Tambaram", "Electrical"),
        ("Karthik Natarajan", "Ambattur", "Plumbing"),
        ("Deepa Krishnamoorthy", "Velachery", "Cleaning & Sanitation"),
        ("Rajesh Varma", "Adyar", "Carpentry & Woodwork"),
        ("Selvan Durai", "T. Nagar", "Electrical"),
        ("Anitha Balaji", "Guindy", "Cleaning & Sanitation"),
        ("Vignesh Kannan", "Porur", "Plumbing"),
        ("Murugan Velu", "Mylapore", "Carpentry & Woodwork"),
        ("Ramesh Babu", "Avadi", "Electrical"),
        ("Suresh Kumar", "Anna Nagar", "Cleaning & Sanitation"),
        ("Divya Sankar", "Tambaram", "Plumbing"),
        ("Bala Subramanian", "Ambattur", "Carpentry & Woodwork"),
        ("Meena Kumari", "Velachery", "Electrical"),
        ("Saravanan Thiru", "Adyar", "Cleaning & Sanitation"),
        ("Geetha Mohan", "T. Nagar", "Plumbing"),
        ("Prakash Raj", "Guindy", "Carpentry & Woodwork"),
        ("Vijay Anand", "Porur", "Electrical"),
        ("Revathi Raman", "Mylapore", "Cleaning & Sanitation"),
        ("Gokul Nath", "Avadi", "Plumbing"),
        ("Nandhini Devi", "Anna Nagar", "Electrical"),
        ("Dinesh Prabhu", "Tambaram", "Carpentry & Woodwork"),
        ("Shalini Victor", "Ambattur", "Cleaning & Sanitation"),
        ("Mohan Das", "Velachery", "Plumbing"),
        ("Kousalya Mani", "Adyar", "Electrical"),
        ("Senthil Vel", "T. Nagar", "Cleaning & Sanitation"),
        ("Jayanthi Raghavan", "Guindy", "Plumbing"),
        ("Kavitha Loganathan", "Porur", "Carpentry & Woodwork"),
        ("Elango Paneerselvam", "Mylapore", "Electrical"),
    ]

    all_workers = [kumar_worker, ravi_worker, mani_worker]

    for idx, (w_name, loc_name, primary_cat) in enumerate(worker_names):
        u_email = f"worker_{idx+4}@coopconnect.demo"
        u = User(name=w_name, email=u_email, password_hash=hashed_pwd, role=UserRole.WORKER, phone=f"+91 9840{idx:02d} {1000+idx}")
        db.add(u)
        db.commit()

        coords = CHENNAI_HUBS[loc_name]
        lat_offset = (random.random() - 0.5) * 0.02
        lng_offset = (random.random() - 0.5) * 0.02

        w = Worker(
            user_id=u.id,
            experience_years=round(random.uniform(2.0, 10.0), 1),
            latitude=coords["lat"] + lat_offset,
            longitude=coords["lng"] + lng_offset,
            location_name=loc_name,
            availability=WorkerAvailabilityEnum.AVAILABLE if idx % 7 != 0 else WorkerAvailabilityEnum.UNAVAILABLE,
            verification_status=VerificationStatusEnum.VERIFIED,
            daily_capacity=5,
            bio=f"Dedicated cooperative member specialized in {primary_cat} with strong customer satisfaction."
        )
        db.add(w)
        db.commit()
        all_workers.append(w)

        # Assign 2-3 relevant skills
        cat_obj = db.query(ServiceCategory).filter(ServiceCategory.name == primary_cat).first()
        if cat_obj and cat_obj.skills:
            for sk in cat_obj.skills[:3]:
                ws = WorkerSkill(
                    worker_id=w.id,
                    skill_id=sk.id,
                    experience_years=round(random.uniform(1.5, 8.0), 1),
                    skill_level=random.choice([SkillLevelEnum.INTERMEDIATE, SkillLevelEnum.ADVANCED, SkillLevelEnum.EXPERT]),
                    verified=True
                )
                db.add(ws)

        # 60% of workers have verified certifications
        if idx % 3 != 0:
            cert = WorkerCertification(
                worker_id=w.id,
                name=f"Certified Professional - {primary_cat}",
                issuing_org="Tamil Nadu Skill Academy",
                credential_id=f"TNSA-{loc_name[:3].upper()}-{2023+idx%2}-{1000+idx}",
                issue_date=datetime(2023, 1, 10),
                expiry_date=datetime(2027, 1, 10),
                verified=True
            )
            db.add(cert)
        db.commit()

    # 5. Create 15 Additional Customers
    customer_list = [customer_user]
    customer_names = [
        "Aravind Swamy", "Bhavani Shankar", "Chandran Nair", "Deepak Chopra",
        "Eashwar Prasad", "Farhana Begum", "Gopinath Muthu", "Harini Venkat",
        "Imran Khan", "Janaki Ram", "Kishore Kumar", "Lavanya Sundar",
        "Madhavan Rao", "Naveen Raj"
    ]
    for idx, c_name in enumerate(customer_names):
        c_u = User(
            name=c_name,
            email=f"customer_{idx+2}@coopconnect.demo",
            password_hash=hashed_pwd,
            role=UserRole.CUSTOMER,
            phone=f"+91 9789{idx:02d} {2000+idx}"
        )
        db.add(c_u)
        db.commit()
        customer_list.append(c_u)

    # 6. Generate 125 Historical Bookings (June 2026 to September 2026)
    services = db.query(Service).all()
    hub_names = list(CHENNAI_HUBS.keys())

    # Pre-seed active bookings for Ravi (so his workload score is naturally lower in allocation demonstration)
    # Give Ravi 2 active jobs
    for i in range(2):
        tank_srv = service_map["Tank Installation"]
        b_ravi = Booking(
            customer_id=customer_list[i + 1].id,
            service_id=tank_srv.id,
            required_skill_id=tank_srv.required_skill_id,
            location_name="Anna Nagar",
            latitude=CHENNAI_HUBS["Anna Nagar"]["lat"],
            longitude=CHENNAI_HUBS["Anna Nagar"]["lng"],
            booking_date="2026-09-08",
            booking_time="02:00 PM",
            status=BookingStatusEnum.IN_PROGRESS,
            assigned_worker_id=ravi_worker.id,
            notes="Active residential tank repair."
        )
        db.add(b_ravi)
    db.commit()

    print("Generating historical bookings for AI forecasting...")
    start_date = datetime(2026, 6, 1)
    for i in range(120):
        # Progressively generate more plumbing in recent months to simulate rising trend
        srv = random.choice(services)
        if i % 3 == 0:
            srv = service_map.get("Tank Installation", srv)
        
        # Distribute over June (6), July (7), August (8), September (9)
        day_offset = random.randint(0, 95)
        b_date = start_date + timedelta(days=day_offset)
        loc = random.choice(hub_names)
        coords = CHENNAI_HUBS[loc]
        cust = random.choice(customer_list)

        # Match an assigned worker with skill
        candidate_workers = (
            db.query(Worker)
            .join(WorkerSkill, WorkerSkill.worker_id == Worker.id)
            .filter(WorkerSkill.skill_id == srv.required_skill_id)
            .all()
        )
        assigned_w = random.choice(candidate_workers) if candidate_workers else all_workers[0]

        booking = Booking(
            customer_id=cust.id,
            service_id=srv.id,
            required_skill_id=srv.required_skill_id,
            location_name=loc,
            latitude=coords["lat"] + (random.random() - 0.5) * 0.01,
            longitude=coords["lng"] + (random.random() - 0.5) * 0.01,
            booking_date=b_date.strftime("%Y-%m-%d"),
            booking_time=random.choice(["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]),
            status=BookingStatusEnum.COMPLETED if b_date < datetime(2026, 9, 1) else random.choice([BookingStatusEnum.COMPLETED, BookingStatusEnum.ACCEPTED]),
            assigned_worker_id=assigned_w.id,
            notes="Standard booking service order"
        )
        db.add(booking)
        db.commit()

        # Add rating if completed
        if booking.status == BookingStatusEnum.COMPLETED:
            rating = Rating(
                booking_id=booking.id,
                customer_id=cust.id,
                worker_id=assigned_w.id,
                rating_score=random.choice([4.5, 5.0, 5.0, 4.8, 4.0]),
                feedback=random.choice([
                    "Excellent and punctual service! Highly skilled worker.",
                    "Very courteous and solved the issue quickly.",
                    "Cooperative worker arrived on time with proper tools.",
                    "Great work on the plumbing line. 5 stars."
                ])
            )
            db.add(rating)

    db.commit()
    ensure_equity_demo_workers(db)
    print("Seeding completed successfully with 30+ workers, 15+ customers, 20+ skills, and 125+ bookings!")
