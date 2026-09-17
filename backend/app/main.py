from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routes import auth, services, bookings, workers, jobs, admin, emergency, work_photos
from sqlalchemy import inspect, text


def ensure_schema_columns():
    inspector = inspect(engine)
    columns_by_table = {
        "users": {
            "mobile_number": "VARCHAR(20)",
            "address": "TEXT",
            "verification_status": "VARCHAR(40) NOT NULL DEFAULT 'VERIFICATION_REQUIRED'",
            "verification_details": "TEXT",
        },
        "workers": {
            "experience_level": "VARCHAR(30) NOT NULL DEFAULT 'INTERMEDIATE'",
            "profile_photo": "VARCHAR(255)",
            "primary_skill": "VARCHAR(100)",
            "additional_skills": "VARCHAR(500)",
        },
        "bookings": {
            "service_address": "TEXT",
            "payment_method": "VARCHAR(40) NOT NULL DEFAULT 'CASH'",
            "payment_status": "VARCHAR(40) NOT NULL DEFAULT 'PENDING'",
            "payment_reference": "VARCHAR(120)",
            "feedback_status": "VARCHAR(40) NOT NULL DEFAULT 'PENDING'",
            "final_amount": "FLOAT",
        },
        "emergency_requests": {
            "payment_method": "VARCHAR(40)",
            "payment_status": "VARCHAR(40) NOT NULL DEFAULT 'PENDING'",
        },
    }

    with engine.begin() as connection:
        for table_name, columns_to_add in columns_by_table.items():
            if table_name not in inspector.get_table_names():
                continue
            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }
            for column_name, column_definition in columns_to_add.items():
                if column_name not in existing_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE {table_name} "
                            f"ADD COLUMN {column_name} {column_definition}"
                        )
                    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()
    
    # Auto-seed database if empty
    from scripts.seed_data import seed_all
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CoopConnect: Digital Operating System for Cooperative Workforces",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(services.router, prefix=settings.API_PREFIX)
app.include_router(bookings.router, prefix=settings.API_PREFIX)
app.include_router(workers.router, prefix=settings.API_PREFIX)
app.include_router(jobs.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(emergency.router, prefix=settings.API_PREFIX)
app.include_router(work_photos.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "Fair Work. Skilled Workers. Smarter Cooperatives.",
        "version": settings.VERSION,
        "docs": "/docs"
    }
