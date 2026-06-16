import React from 'react';
import { useInfrastructureSubmissions, useApproveInfrastructureSubmission, useReturnInfrastructureSubmission } from '../../hooks/queries/useInfrastructure';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle, Search, Eye, MessageSquare } from 'lucide-react';

const IS_DEV_MODE = !isSupabaseConfigured;

export default function InfrastructureReviewPanel() {
  const { data: submissions, isLoading } = useInfrastructureSubmissions();
  const approveMutation = useApproveInfrastructureSubmission();
  const returnMutation = useReturnInfrastructureSubmission();

  const handleApprove = async (id: string) => {
    if (window.confirm('Are you sure you want to approve and commit this infrastructure snapshot?')) {
      await approveMutation.mutateAsync({ submissionId: id });
      window.alert('Snapshot committed successfully');
    }
  };

  const handleReturn = async (id: string) => {
    const remarks = window.prompt('Enter remarks for return:');
    if (remarks) {
      await returnMutation.mutateAsync({ submissionId: id, remarks });
      window.alert('Submission returned');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading submissions...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {IS_DEV_MODE && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          <p className="font-bold">UI REVIEW MOCK DATA MODE</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Infrastructure Review Panel</h1>
          <p className="text-gray-500 mt-1">Review and approve school infrastructure census submissions.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search schools..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {submissions?.map((sub) => (
            <li key={sub.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{sub.office_name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${sub.status === 'COMMITTED' ? 'bg-green-100 text-green-800' : 
                          sub.status === 'RETURNED' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {sub.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:space-x-4">
                      <p className="flex items-center text-sm text-gray-500">
                        <Eye className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        View Evidence
                      </p>
                      {sub.reviewer_remarks && (
                        <p className="flex items-center text-sm text-gray-500 mt-2 sm:mt-0">
                          <MessageSquare className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Remarks: {sub.reviewer_remarks}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm sm:mt-0 space-x-3">
                      {(sub.status === 'SUBMITTED' || sub.status === 'IN_REVIEW') && (
                        <>
                          <button
                            onClick={() => handleReturn(sub.id)}
                            className="inline-flex items-center text-red-600 hover:text-red-900"
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Return
                          </button>
                          <button
                            onClick={() => handleApprove(sub.id)}
                            className="inline-flex items-center text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {submissions?.length === 0 && (
            <div className="p-8 text-center text-gray-500">No submissions found to review.</div>
          )}
        </ul>
      </div>
    </div>
  );
}
