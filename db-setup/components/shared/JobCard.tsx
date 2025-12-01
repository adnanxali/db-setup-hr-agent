'use client';

import { useAppStore } from '@/store/useAppStore';
import { Job } from '@/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const openApplyModal = useAppStore((state) => state.openApplyModal);
  const user = useAppStore((state) => state.user);

  const handleApply = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Application submitted successfully!');
      } else {
        alert(result.error || 'Failed to apply');
      }
    } catch (error) {
      alert('An error occurred while applying');
    }
  };

  return (
    <div className="border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
          <p className="text-gray-600">
            {job.pipeline_config?.company || job.recruiter?.company || 'Company'}
          </p>
          <p className="text-sm text-gray-500">{job.location}</p>
        </div>
        {job.salary_range && (
          <span className="text-green-600 font-medium">{job.salary_range}</span>
        )}
      </div>
      
      <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags && job.tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
          >
            {tag}
          </span>
        ))}
        {job.pipeline_config?.type && (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full capitalize">
            {job.pipeline_config.type.replace('-', ' ')}
          </span>
        )}
        {job.pipeline_config?.remote_type && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full capitalize">
            {job.pipeline_config.remote_type}
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Posted {new Date(job.created_at).toLocaleDateString()}
        </span>
        
        {user?.role === 'candidate' && (
          <button
            onClick={handleApply}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Quick Apply
          </button>
        )}
      </div>
    </div>
  );
}