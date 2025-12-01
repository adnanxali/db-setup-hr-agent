import { createClient } from '@/lib/supabase/server-client';
import { 
  User, 
  Job, 
  Application, 
  CandidateProfile, 
  RecruiterProfile,
  JobFormData,
  CandidateProfileFormData,
  RecruiterProfileFormData,
  UserRole,
  JobStatus,
  ApplicationStatus
} from '@/types';

// User operations
export async function getUserById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as User;
}

export async function updateUserRole(id: string, role: UserRole) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as User;
}

// Job operations
export async function getJobs(filters?: { 
  tag?: string; 
  status?: JobStatus; 
  recruiterId?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('jobs')
    .select(`
      *,
      recruiter:users!jobs_recruiter_id_fkey(
        id,
        full_name,
        company
      )
    `);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.recruiterId) {
    query = query.eq('recruiter_id', filters.recruiterId);
  }
  
  if (filters?.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data: data as Job[], count: count || 0 };
}

export async function getJobById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      recruiter:users!jobs_recruiter_id_fkey(
        id,
        full_name,
        company,
        email
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Job;
}

export async function createJob(recruiterId: string, jobData: JobFormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      recruiter_id: recruiterId,
      ...jobData,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, jobData: Partial<JobFormData>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Application operations
export async function getApplications(filters?: {
  jobId?: string;
  candidateId?: string;
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*),
      candidate:users!applications_candidate_id_fkey(
        *,
        candidate_profiles(*)
      )
    `);

  if (filters?.jobId) {
    query = query.eq('job_id', filters.jobId);
  }
  
  if (filters?.candidateId) {
    query = query.eq('candidate_id', filters.candidateId);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  
  if (error) throw error;
  return { data: data as Application[], count: count || 0 };
}

export async function createApplication(jobId: string, candidateId: string, coverLetter?: string) {
  const supabase = await createClient();
  
  // Check if application already exists
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('candidate_id', candidateId)
    .single();

  if (existing) {
    throw new Error('Application already exists');
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      cover_letter: coverLetter,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, score?: number) {
  const supabase = await createClient();
  const updateData: any = { status };
  if (score !== undefined) updateData.score = score;

  const { data, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Application;
}

// Profile operations
export async function getCandidateProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data as CandidateProfile | null;
}

export async function upsertCandidateProfile(userId: string, profileData: CandidateProfileFormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('candidate_profiles')
    .upsert({
      user_id: userId,
      ...profileData,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as CandidateProfile;
}

export async function getRecruiterProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recruiter_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data as RecruiterProfile | null;
}

export async function upsertRecruiterProfile(userId: string, profileData: RecruiterProfileFormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recruiter_profiles')
    .upsert({
      user_id: userId,
      ...profileData,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as RecruiterProfile;
}