import { useDeficiencies } from '../../hooks/queries/useInfrastructure';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const IS_DEV_MODE = !isSupabaseConfigured;

export default function DeficiencyDashboard() {
  const { data: deficiencies, isLoading } = useDeficiencies();

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading dashboard...</div>;

  const criticalCount = deficiencies?.filter(d => d.severity === 'CRITICAL').length || 0;
  const highCount = deficiencies?.filter(d => d.severity === 'HIGH').length || 0;
  const mediumCount = deficiencies?.filter(d => d.severity === 'MEDIUM').length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {IS_DEV_MODE && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          <p className="font-bold">UI REVIEW MOCK DATA MODE</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Infrastructure Deficiency Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor critical infrastructure gaps derived from approved snapshots.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">Critical Deficiencies</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">High Deficiencies</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{highCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <Info className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">Medium Deficiencies</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{mediumCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500 truncate">Resolved Issues</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Deficiency Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deficiency Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deficiencies?.map((def, idx) => (
                <tr key={`${def.latest_snapshot_id}-${idx}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {def.office_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {def.deficiency_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${def.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                        def.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {def.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(def.last_updated).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
