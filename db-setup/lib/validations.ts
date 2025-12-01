import { z } from 'zod';

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['candidate', 'recruiter', 'super_admin']),
  full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Job schemas
export const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().optional(),
  salary_range: z.string().optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

export const jobUpdateSchema = jobSchema.partial();

export const jobStatusSchema = z.object({
  status: z.enum(['open', 'closed', 'archived']),
});

// Application schemas
export const applicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  cover_letter: z.string().optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(['applied', 'screening', 'interview_scheduled', 'rejected', 'hired']),
  score: z.number().min(0).max(100).optional(),
});

// Profile schemas
export const candidateProfileSchema = z.object({
  resume_url: z.string().url('Invalid URL').optional(),
  skills: z.array(z.string()).default([]),
  experience_years: z.number().min(0).max(50).default(0),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional(),
  portfolio_url: z.string().url('Invalid portfolio URL').optional(),
});

export const recruiterProfileSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_website: z.string().url('Invalid website URL').optional(),
  company_logo: z.string().url('Invalid logo URL').optional(),
});

// Admin schemas
export const userRoleUpdateSchema = z.object({
  role: z.enum(['candidate', 'recruiter', 'super_admin']),
});

// Pipeline schemas
export const pipelineConfigSchema = z.object({
  auto_reject_score: z.number().min(0).max(100).default(50),
  stages: z.array(z.object({
    name: z.string(),
    order: z.number(),
    auto_advance: z.boolean().default(false),
  })).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const jobFiltersSchema = z.object({
  tag: z.string().optional(),
  status: z.enum(['open', 'closed', 'archived']).optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

export const applicationFiltersSchema = z.object({
  status: z.enum(['applied', 'screening', 'interview_scheduled', 'rejected', 'hired']).optional(),
}).merge(paginationSchema);