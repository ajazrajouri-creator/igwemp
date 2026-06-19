import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfrastructureMetricsSchema, checkMandatoryEvidence } from '../../lib/validations/infrastructure';
import type { InfrastructureMetricsFormValues } from '../../lib/validations/infrastructure';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Upload, Save, Send, AlertTriangle, Building, Droplets,  Camera, Map, Home, BookOpen} from 'lucide-react';

const IS_DEV_MODE = !isSupabaseConfigured;

// Mock master data items for UI review
const MOCK_LAND_STATUSES = [
  { id: 'uuid-land-1', name: 'Donated Land' },
  { id: 'uuid-land-2', name: 'State Land' },
  { id: 'uuid-land-3', name: 'Forest Land' },
  { id: 'uuid-land-4', name: 'Other' }
];

export default function InfrastructureCensusForm() {
  const [activeTab, setActiveTab] = useState<'land' | 'buildings' | 'rooms' | 'facilities' | 'wash' | 'evidence'>('land');
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([]);
  // Simulated school level for conditional logic
  const [schoolLevel, setSchoolLevel] = useState<'PS' | 'MS' | 'HS' | 'HSS'>('HS');

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<InfrastructureMetricsFormValues & { buildings: any[] }>({
    resolver: zodResolver(InfrastructureMetricsSchema) as any,
    defaultValues: {
      total_classrooms: 0,
      functional_classrooms: 0,
      boys_toilets: 0,
      functional_boys_toilets: 0,
      boys_toilets_functional: 0,
      girls_toilets: 0,
      functional_girls_toilets: 0,
      girls_toilets_functional: 0,
      staff_toilets: 0,
      staff_toilets_functional: 0,
      water_functional: false,
      electricity_functional: false,
      building_available: false,
      buildings: []
    }
  });

  const { fields: buildingFields, append: appendBuilding, remove: removeBuilding } = useFieldArray({
    control,
    name: 'buildings' as never
  });

  const formData = watch();
  const missingEvidence = checkMandatoryEvidence(formData as InfrastructureMetricsFormValues, uploadedKeys);

  const onSubmit = (data: any) => {
    if (missingEvidence.length > 0) {
      alert(`Missing mandatory evidence for: ${missingEvidence.join(', ')}`);
      return;
    }
    console.log('Submitting data:', data);
    alert('Form submitted successfully!');
  };

  const handleMockUpload = (key: string) => {
    setUploadedKeys(prev => [...prev, key]);
    alert(`Mock uploaded file for ${key}`);
  };

  const isHighSchool = schoolLevel === 'HS' || schoolLevel === 'HSS';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {IS_DEV_MODE && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          <p className="font-bold">UI REVIEW MOCK DATA MODE</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Infrastructure Census Form</h1>
        <p className="text-gray-500 mt-1">Submit infrastructure details for your institution.</p>
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 mr-2">Simulate School Level:</label>
          <select value={schoolLevel} onChange={e => setSchoolLevel(e.target.value as any)} className="border-gray-300 rounded-md text-sm">
            <option value="PS">Primary School (PS)</option>
            <option value="MS">Middle School (MS)</option>
            <option value="HS">High School (HS)</option>
            <option value="HSS">Higher Secondary (HSS)</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
          {[
            { id: 'land', name: 'Land', icon: Map },
            { id: 'buildings', name: 'Buildings', icon: Home },
            { id: 'rooms', name: 'Rooms & Classrooms', icon: Building },
            { id: 'facilities', name: 'Special Facilities', icon: BookOpen },
            { id: 'wash', name: 'WASH', icon: Droplets },
            { id: 'evidence', name: 'Evidence', icon: Camera },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* LAND TAB */}
        {activeTab === 'land' && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Land Details</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Land Status</label>
                <select {...register('land_status_id')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Select status...</option>
                  {MOCK_LAND_STATUSES.map(ls => (
                    <option key={ls.id} value={ls.id}>{ls.name}</option>
                  ))}
                </select>
                {errors.land_status_id && <p className="mt-1 text-sm text-red-600">{errors.land_status_id.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Measurement (Kanal)</label>
                  <input type="number" step="0.01" {...register('land_measurement_kanal', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Measurement (Marla)</label>
                  <input type="number" step="0.01" {...register('land_measurement_marla', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Land Remarks (Optional)</label>
                <textarea {...register('land_remarks')} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* BUILDINGS TAB */}
        {activeTab === 'buildings' && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Building Information</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" {...register('building_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                <span className="ml-2 text-sm text-gray-900">School Building is Available</span>
              </label>

              {formData.building_available && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium text-gray-800">Building Blocks</h3>
                    <button type="button" onClick={() => appendBuilding({ total_rooms: 0, functional_rooms: 0, non_functional_rooms: 0 })} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-100">
                      + Add Building
                    </button>
                  </div>
                  
                  {buildingFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50 relative">
                      <button type="button" onClick={() => removeBuilding(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                        &times; Remove
                      </button>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Building #{index + 1}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Total Rooms</label>
                          <input type="number" {...register(`buildings.${index}.total_rooms` as any, { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Functional Rooms</label>
                          <input type="number" {...register(`buildings.${index}.functional_rooms` as any, { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Non-Functional Rooms</label>
                          <input type="number" {...register(`buildings.${index}.non_functional_rooms` as any, { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {buildingFields.length === 0 && <p className="text-sm text-gray-500 italic">No buildings added yet.</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Room & Classroom Details</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Classrooms</label>
                <input type="number" {...register('total_classrooms', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                {errors.total_classrooms && <p className="mt-1 text-sm text-red-600">{errors.total_classrooms.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Functional Classrooms</label>
                <input type="number" {...register('functional_classrooms', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                {errors.functional_classrooms && <p className="mt-1 text-sm text-red-600">{errors.functional_classrooms.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Non-Functional Classrooms</label>
                <input type="number" {...register('non_functional_classrooms', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Classrooms Needing Repair</label>
                <input type="number" {...register('classrooms_needing_repair', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                {errors.classrooms_needing_repair && <p className="mt-1 text-sm text-red-600">{errors.classrooms_needing_repair.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dilapidated Classrooms</label>
                <input type="number" {...register('classrooms_dilapidated', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* FACILITIES TAB (HS/HSS Special Rooms) */}
        {activeTab === 'facilities' && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Special Facilities</h2>
            
            {isHighSchool && (
              <div className="space-y-6 pb-6 border-b border-gray-200" data-testid="hs-hss-special-rooms">
                <h3 className="text-sm font-bold text-gray-700 uppercase">HS/HSS Special Rooms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <label className="flex items-center">
                      <input type="checkbox" {...register('computer_room_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                      <span className="ml-2 text-sm text-gray-900 font-medium">Computer Room</span>
                    </label>
                    <label className="flex items-center mt-2 ml-6">
                      <input type="checkbox" {...register('computer_room_functional')} disabled={!formData.computer_room_available} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                      <span className={`ml-2 text-sm ${formData.computer_room_available ? 'text-gray-700' : 'text-gray-400'}`}>Functional</span>
                    </label>
                  </div>
                  <div className="border rounded-md p-3">
                    <label className="flex items-center">
                      <input type="checkbox" {...register('library_room_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                      <span className="ml-2 text-sm text-gray-900 font-medium">Library Room</span>
                    </label>
                    <label className="flex items-center mt-2 ml-6">
                      <input type="checkbox" {...register('library_room_functional')} disabled={!formData.library_room_available} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                      <span className={`ml-2 text-sm ${formData.library_room_available ? 'text-gray-700' : 'text-gray-400'}`}>Functional</span>
                    </label>
                  </div>
                  <div className="border rounded-md p-3">
                    <label className="flex items-center">
                      <input type="checkbox" {...register('laboratory_room_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                      <span className="ml-2 text-sm text-gray-900 font-medium">Laboratory Room</span>
                    </label>
                    <label className="flex items-center mt-2 ml-6">
                      <input type="checkbox" {...register('laboratory_room_functional')} disabled={!formData.laboratory_room_available} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                      <span className={`ml-2 text-sm ${formData.laboratory_room_available ? 'text-gray-700' : 'text-gray-400'}`}>Functional</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase">General Infrastructure</h3>
              <label className="flex items-center">
                <input type="checkbox" {...register('electricity_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                <span className="ml-2 text-sm text-gray-900">Electricity Available</span>
              </label>
              {formData.electricity_available && (
                <label className="flex items-center ml-6">
                  <input type="checkbox" {...register('electricity_functional')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                  <span className="ml-2 text-sm text-gray-700">Electricity is Functional</span>
                </label>
              )}
              <label className="flex items-center">
                <input type="checkbox" {...register('playground_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                <span className="ml-2 text-sm text-gray-900">Playground Available</span>
              </label>
            </div>
          </div>
        )}

        {/* WASH TAB */}
        {activeTab === 'wash' && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Water, Sanitation & Hygiene</h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 pb-6 border-b border-gray-200">
              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Toilet Facilities</h3>
              </div>
              <div className="bg-blue-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700">Total Boys Toilets</label>
                <input type="number" {...register('boys_toilets', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                <label className="block text-sm font-medium text-gray-700 mt-3">Functional Boys Toilets</label>
                <input type="number" {...register('boys_toilets_functional', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                {errors.boys_toilets_functional && <p className="mt-1 text-sm text-red-600">{errors.boys_toilets_functional.message as string}</p>}
              </div>
              <div className="bg-pink-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700">Total Girls Toilets</label>
                <input type="number" {...register('girls_toilets', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                <label className="block text-sm font-medium text-gray-700 mt-3">Functional Girls Toilets</label>
                <input type="number" {...register('girls_toilets_functional', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                {errors.girls_toilets_functional && <p className="mt-1 text-sm text-red-600">{errors.girls_toilets_functional.message as string}</p>}
              </div>
              <div className="bg-gray-50 p-4 rounded-md sm:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Staff Toilets</label>
                    <input type="number" {...register('staff_toilets', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Functional Staff Toilets</label>
                    <input type="number" {...register('staff_toilets_functional', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    {errors.staff_toilets_functional && <p className="mt-1 text-sm text-red-600">{errors.staff_toilets_functional.message as string}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase">Drinking Water Facility</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" {...register('drinking_water_available')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                    <span className="ml-2 text-sm text-gray-900">Drinking Water Available</span>
                  </label>
                  {formData.drinking_water_available && (
                    <label className="flex items-center mt-2 ml-6">
                      <input type="checkbox" {...register('drinking_water_functional')} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
                      <span className="ml-2 text-sm text-gray-700">Water is Functional</span>
                    </label>
                  )}
                </div>
                {formData.drinking_water_available && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Water Source</label>
                    <select {...register('drinking_water_source_id')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      <option value="">Select source...</option>
                      <option value="tap">Tap Water</option>
                      <option value="handpump">Hand Pump</option>
                      <option value="borewell">Borewell</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Mandatory Evidence Uploads</h2>
            <p className="text-sm text-gray-500">Upload photos for available facilities.</p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {formData.building_available && (
                <EvidenceCard 
                  title="Main School Building" 
                  isUploaded={uploadedKeys.includes('building')} 
                  onUpload={() => handleMockUpload('building')} 
                />
              )}
              {formData.boys_toilets > 0 && (
                <EvidenceCard 
                  title="Boys Toilet" 
                  isUploaded={uploadedKeys.includes('boys_toilets')} 
                  onUpload={() => handleMockUpload('boys_toilets')} 
                />
              )}
              {formData.girls_toilets > 0 && (
                <EvidenceCard 
                  title="Girls Toilet" 
                  isUploaded={uploadedKeys.includes('girls_toilets')} 
                  onUpload={() => handleMockUpload('girls_toilets')} 
                />
              )}
              {formData.drinking_water_available && (
                <EvidenceCard 
                  title="Drinking Water Facility" 
                  isUploaded={uploadedKeys.includes('drinking_water')} 
                  onUpload={() => handleMockUpload('drinking_water')} 
                />
              )}
              {formData.electricity_available && (
                <EvidenceCard 
                  title="Electricity Connection/Panel" 
                  isUploaded={uploadedKeys.includes('electricity')} 
                  onUpload={() => handleMockUpload('electricity')} 
                />
              )}
            </div>

            {missingEvidence.length > 0 && (
              <div className="rounded-md bg-red-50 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Missing Mandatory Evidence</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {missingEvidence.map(key => <li key={key}>{key.replace('_', ' ')}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button type="button" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </button>
          <button 
            type="submit" 
            disabled={missingEvidence.length > 0}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            <Send className="mr-2 h-4 w-4" /> Submit Census
          </button>
        </div>
      </form>
    </div>
  );
}

function EvidenceCard({ title, isUploaded, onUpload }: { title: string, isUploaded: boolean, onUpload: () => void }) {
  return (
    <div className={`border rounded-lg p-4 flex items-center justify-between ${isUploaded ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
      <div>
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{isUploaded ? 'Evidence Uploaded' : 'Pending Upload (Required)'}</p>
      </div>
      <button
        type="button"
        onClick={onUpload}
        className={`p-2 rounded-full ${isUploaded ? 'text-green-600 bg-green-100' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
      >
        <Upload className="h-5 w-5" />
      </button>
    </div>
  );
}
