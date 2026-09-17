export type UserRole = 'CUSTOMER' | 'WORKER' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'VERIFICATION_REQUIRED';
export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERIENCED' | 'EXPERT';
export type PaymentMethod = 'CASH' | 'GPay / UPI' | 'UPI' | 'G_PAY_UPI';
export type PaymentStatus = 'PENDING' | 'PAYMENT_INITIATED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PAYMENT_VERIFICATION_REQUIRED';
export type FeedbackStatus = 'PENDING' | 'SUBMITTED' | 'UPDATED';

export interface CustomerAddress {
  full_name: string;
  mobile_number: string;
  house_flat_number: string;
  street_name: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  additional_instructions?: string;
}

export interface VerificationDocument {
  id?: number;
  document_type: string;
  file_name?: string;
  file_url?: string;
  uploaded_at?: string;
  status?: VerificationStatus;
  review_notes?: string;
}

export interface VerificationRecord {
  id?: number;
  user_id?: number;
  account_type?: 'CUSTOMER' | 'WORKER';
  verification_status?: VerificationStatus;
  submitted_documents?: VerificationDocument[];
  admin_review_notes?: string;
  reviewed_at?: string;
  created_at?: string;
}

export interface BookingPayment {
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_reference?: string;
  service_amount?: number;
  final_amount?: number;
}

export interface BookingFeedback {
  id?: number;
  booking_id?: number;
  customer_id?: number;
  worker_id?: number;
  rating_score: number;
  feedback?: string;
  created_at?: string;
}

export type WorkPhotoVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WorkPhotoSubmission {
  id: number;
  booking_id: number;
  worker_id: number;
  customer_id: number;
  before_photo_url: string;
  after_photo_url: string;
  before_photo_name?: string;
  after_photo_name?: string;
  status: WorkPhotoVerificationStatus;
  admin_note?: string | null;
  reviewed_by_admin_id?: number | null;
  submitted_at: string;
  reviewed_at?: string | null;
  booking?: Booking;
  worker?: WorkerProfile;
  customer?: User;
}

export interface WorkerReview {
  id: number;
  booking_id: number;
  customer_id: number;
  worker_id: number;
  rating_score: number;
  feedback?: string | null;
  created_at: string;
  customer?: User;
  booking?: Booking;
}

export const CHENNAI_LOCATIONS = [
  'Anna Nagar', 'Tambaram', 'Ambattur', 'Avadi', 'Velachery', 'Adyar',
  'T. Nagar', 'Guindy', 'Porur','perambur', 'Mylapore', 'Nungambakkam', 'Kodambakkam',
  'Royapettah','thirumulaivoyil', 'Perungudi', 'Sholinganallur', 'Madipakkam', 'Poonamallee',
  'Red Hills',
] as const;

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  mobile_number?: string;
  avatar_url?: string;
  address?: CustomerAddress;
  verification_status?: VerificationStatus;
  verification_details?: VerificationRecord | null;
  worker_profile?: {
    worker_id: number;
    availability: 'AVAILABLE' | 'UNAVAILABLE';
    location_name: string;
    experience_years: number;
    experience_level?: ExperienceLevel;
    verification_status: VerificationStatus;
    skills?: string[];
    mobile_number?: string;
  };
}

export interface ServiceCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon: string;
  skills: Skill[];
}

export interface Skill {
  id: number;
  category_id: number;
  name: string;
  description?: string;
}

export interface Service {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  required_skill_id: number;
  base_price: number;
  estimated_duration_mins: number;
  active: boolean;
  category?: ServiceCategory;
  required_skill?: Skill;
}

export interface CandidateScore {
  worker_id: number;
  worker_name: string;
  skill_score: number;
  workload_score: number;
  availability_score: number;
  distance_score: number;
  certification_score: number;
  final_score: number;
  is_selected: boolean;
  candidate_rank: number;
  selection_reason: string;
  distance_km: number;
  skills?: string[];
  worker_experience_years?: number;
  worker_average_rating?: number;
  completed_service_count?: number;
  worker_bio?: string;
}

export type BookingStatus =
  | 'PENDING'
  | 'WORKER_ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RATED'
  | 'CANCELLED'
  | 'REASSIGNING';

export interface Booking {
  id: number;
  customer_id: number;
  service_id: number;
  required_skill_id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  assigned_worker_id?: number;
  notes?: string;
  service_address?: CustomerAddress | null;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_reference?: string;
  feedback_status?: FeedbackStatus;
  created_at: string;
  updated_at: string;
  customer?: User;
  service?: Service;
  required_skill?: Skill;
  assigned_worker?: {
    id: number;
    name: string;
    phone?: string;
    mobile_number?: string;
    experience_years: number;
    location_name: string;
    verification_status: VerificationStatus;
    skills?: string[];
  };
  rating?: BookingFeedback;
  payment?: BookingPayment;
  candidates: CandidateScore[];
}

export type EmergencyPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type EmergencyStatus = 'OPEN' | 'WORKERS_NOTIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EmergencyRequest {
  id: number;
  customer_id: number;
  requested_service: string;
  service_address?: CustomerAddress | Record<string, any> | null;
  customer_mobile?: string;
  description?: string;
  priority: EmergencyPriority;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  status: EmergencyStatus;
  responding_worker_id?: number | null;
  admin_notes?: string | null;
  notified_workers: number[];
  requested_at: string;
  responded_at?: string | null;
  completed_at?: string | null;
}

export interface WorkerSkill {
  id: number;
  skill_id: number;
  experience_years: number;
  skill_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  verified: boolean;
  skill?: Skill;
}

export interface WorkerCertification {
  id: number;
  name: string;
  issuing_org: string;
  credential_id?: string;
  issue_date?: string;
  expiry_date?: string;
  verified: boolean;
}

export interface WorkerProfile {
  id: number;
  user_id: number;
  experience_years: number;
  experience_level?: ExperienceLevel;
  latitude: number;
  longitude: number;
  location_name: string;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  verification_status: VerificationStatus;
  daily_capacity: number;
  bio?: string;
  profile_photo?: string;
  primary_skill?: string;
  additional_skills?: string[];
  mobile_number?: string;
  user?: User;
  skills: WorkerSkill[];
  certifications: WorkerCertification[];
  active_jobs_count: number;
  average_rating: number;
  utilization_rate: number;
}

export interface SkillGapItem {
  skill_id: number;
  skill_name: string;
  category_name: string;
  expected_monthly_demand: number;
  available_monthly_capacity: number;
  shortage_units: number;
  severity: 'NORMAL' | 'MODERATE' | 'CRITICAL';
  recommendation: string;
  qualified_workers_count: number;
}

export interface ForecastItem {
  service_id: number;
  service_name: string;
  category_name: string;
  location_name: string;
  forecast_month: string;
  predicted_bookings: number;
  demand_level: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: 'UP' | 'STABLE' | 'DOWN';
  confidence: number;
  historical_trend: number[];
  growth_rate: number;
}

export interface DemandByLocation {
  location_name: string;
  latitude: number;
  longitude: number;
  booking_count: number;
  worker_count?: number;
  demand_intensity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WorkerEquityItem {
  worker_id: number;
  worker_name: string;
  skills: string[];
  assigned_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  utilization_percent: number;
  eligible: boolean;
  equity_score: number;
  status: 'Balanced' | 'Under-utilized' | 'Overloaded' | 'Not eligible';
}

export interface WorkerEquitySummary {
  total_workers: number;
  eligible_workers: number;
  average_workload: number;
  most_utilized_worker?: string;
  under_utilized_workers: number;
  overloaded_workers: number;
  overall_equity_score: number;
  workers: WorkerEquityItem[];
}

export interface VerificationQueueItem {
  id: number;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'WORKER';
  mobile_number?: string;
  verification_status: VerificationStatus;
  address?: CustomerAddress | null;
  worker_profile?: {
    worker_id: number;
    location_name?: string;
    experience_years?: number;
    primary_skill?: string;
    verification_status: VerificationStatus;
  } | null;
  created_at?: string;
}

export interface AdminDashboardStats {
  total_workers: number;
  available_workers: number;
  total_customers: number;
  todays_bookings: number;
  completed_jobs: number;
  pending_jobs: number;
  average_system_rating: number;
  average_allocation_score: number;
  workforce_utilization_percent: number;
  top_skill_gaps: SkillGapItem[];
  ai_recommendations: string[];
}
