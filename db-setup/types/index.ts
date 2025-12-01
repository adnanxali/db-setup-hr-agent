// Database Types
export type UserRole = 'candidate' | 'recruiter' | 'admin';
export type JobStatus = 'open' | 'closed' | 'archived';
export type ApplicationStatus = 'applied' | 'screening' | 'interview_scheduled' | 'rejected' | 'hired';

// Core Interfaces
export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  resume_url: string | null;
  skills: string[] | null;
  experience_years: number;
  bio: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruiterProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_website: string | null;
  company_logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  location: string | null;
  tags: string[] | null;
  status: JobStatus;
  pipeline_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  recruiter_profiles?: RecruiterProfile;
  applications?: Application[];
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  score: number;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  job?: Job;
  candidate?: User & { candidate_profiles?: CandidateProfile };
}

export interface Pipeline {
  id: string;
  job_id: string;
  stage_name: string;
  trigger_condition: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface SignUpData {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
}

export interface JobFormData {
  title: string;
  description: string;
  requirements?: string;
  salary_range?: string;
  location?: string;
  tags: string[];
}

export interface CandidateProfileFormData {
  resume_url?: string;
  skills: string[];
  experience_years: number;
  bio?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

export interface RecruiterProfileFormData {
  company_name: string;
  company_website?: string;
  company_logo?: string;
}