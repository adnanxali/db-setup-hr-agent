import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-client';
import { ApiResponse } from '@/types';
import { z } from 'zod';

const startPipelineSchema = z.object({
  candidates: z.array(z.string().uuid()).min(1, 'At least one candidate is required'),
  pipeline_config: z.object({
    auto_reject_score: z.number().min(0).max(100).optional(),
    stages: z.array(z.string()).optional(),
  }).optional(),
});

// POST /api/recruiter/jobs/[jobId]/start-pipeline - Start AI pipeline for selected candidates
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const response: ApiResponse = { error: 'Unauthorized' };
      return NextResponse.json(response, { status: 401 });
    }

    // Validate job ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('recruiter_id, pipeline_config')
      .eq('id', params.jobId)
      .single();

    if (jobError || !job || job.recruiter_id !== session.user.id) {
      const response: ApiResponse = { error: 'Job not found or access denied' };
      return NextResponse.json(response, { status: 404 });
    }

    const body = await request.json();
    const validatedData = startPipelineSchema.parse(body);

    // Update applications status to screening
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        status: 'screening',
        score: 0 // Reset score for new pipeline
      })
      .in('id', validatedData.candidates)
      .eq('job_id', params.jobId); // Ensure applications belong to this job

    if (updateError) {
      const response: ApiResponse = { error: updateError.message };
      return NextResponse.json(response, { status: 500 });
    }

    // Update job pipeline config if provided
    if (validatedData.pipeline_config) {
      const updatedConfig = {
        ...job.pipeline_config,
        ...validatedData.pipeline_config,
        last_pipeline_start: new Date().toISOString(),
      };

      await supabase
        .from('jobs')
        .update({ pipeline_config: updatedConfig })
        .eq('id', params.jobId);
    }

    // Log pipeline start for future AI integration
    console.log(`[PIPELINE STARTED] Job: ${params.jobId}, Candidates: ${validatedData.candidates.length}`, {
      jobId: params.jobId,
      candidateIds: validatedData.candidates,
      config: validatedData.pipeline_config,
      timestamp: new Date().toISOString(),
    });

    // Future: This is where you would trigger AI interview pipeline
    // await triggerAIInterviewPipeline(params.jobId, validatedData.candidates);

    const response: ApiResponse = {
      message: `Pipeline started successfully for ${validatedData.candidates.length} candidates. They have been moved to screening stage.`
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting pipeline:', error);
    
    const apiResponse: ApiResponse = {
      error: error instanceof Error ? error.message : 'Failed to start pipeline'
    };
    
    return NextResponse.json(apiResponse, { status: 500 });
  }
}