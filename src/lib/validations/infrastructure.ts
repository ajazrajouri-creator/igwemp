import { z } from 'zod';

// ─── Building Schema ──────────────────────────────────────────
export const BuildingSchema = z.object({
  building_no: z.number().int().min(1, 'Building number must be positive'),
  building_name: z.string().optional(),
  total_rooms: z.number().int().min(0, 'Total rooms must be ≥ 0').default(0),
  functional_rooms: z.number().int().min(0).default(0),
  non_functional_rooms: z.number().int().min(0).default(0),
  building_status_id: z.string().uuid('Invalid building status').nullable().default(null),
  remarks: z.string().optional(),
}).refine(data => data.functional_rooms + data.non_functional_rooms <= data.total_rooms, {
  message: 'Functional + non-functional rooms cannot exceed total rooms',
  path: ['total_rooms'],
});

export type BuildingFormValues = z.infer<typeof BuildingSchema>;

// ─── Main Infrastructure Metrics Schema ───────────────────────
export const InfrastructureMetricsSchema = z.object({
  // ── LAND ──
  land_status_id: z.string().uuid('Invalid land status').nullable().default(null),
  land_measurement_kanal: z.number().min(0, 'Kanal must be ≥ 0').default(0),
  land_measurement_marla: z.number().min(0, 'Marla must be ≥ 0').nullable().optional(),
  land_remarks: z.string().optional(),

  // ── BUILDING ──
  building_available: z.boolean().default(false),
  total_buildings: z.number().int().min(0, 'Total buildings must be ≥ 0').default(0),
  building_remarks: z.string().optional(),

  // ── CLASSROOMS ──
  total_classrooms: z.number().int().min(0, 'Total classrooms must be ≥ 0').default(0),
  functional_classrooms: z.number().int().min(0).default(0),
  non_functional_classrooms: z.number().int().min(0).default(0),
  classrooms_needing_repair: z.number().int().min(0).default(0),
  classrooms_dilapidated: z.number().int().min(0).default(0),

  // ── ROOMS (legacy compat) ──
  total_rooms: z.number().int().min(0).default(0),
  staff_rooms: z.number().int().min(0).default(0),
  office_room_available: z.boolean().default(false),

  // ── HS/HSS SPECIAL ROOMS ──
  computer_room_available: z.boolean().default(false),
  computer_room_functional: z.boolean().default(false),
  library_room_available: z.boolean().default(false),
  library_room_functional: z.boolean().default(false),
  laboratory_room_available: z.boolean().default(false),
  laboratory_room_functional: z.boolean().default(false),

  // ── TOILETS ──
  boys_toilets: z.number().int().min(0, "Boys' toilets must be ≥ 0").default(0),
  boys_toilets_functional: z.number().int().min(0).default(0),
  girls_toilets: z.number().int().min(0, "Girls' toilets must be ≥ 0").default(0),
  girls_toilets_functional: z.number().int().min(0).default(0),
  staff_toilets: z.number().int().min(0).default(0),
  staff_toilets_functional: z.number().int().min(0).default(0),
  cwsn_toilet_available: z.boolean().default(false),
  toilet_remarks: z.string().optional(),

  // ── LEGACY TOILET COMPAT ──
  functional_boys_toilets: z.number().int().min(0).default(0),
  functional_girls_toilets: z.number().int().min(0).default(0),

  // ── ELECTRICITY ──
  electricity_available: z.boolean().default(false),
  electricity_functional: z.boolean().default(false),
  electricity_remarks: z.string().optional(),

  // ── DRINKING WATER ──
  drinking_water_available: z.boolean().default(false),
  drinking_water_functional: z.boolean().default(false),
  drinking_water_source_id: z.string().uuid('Invalid water source').nullable().default(null),
  drinking_water_remarks: z.string().optional(),

  // ── OTHER FACILITIES ──
  boundary_wall_type_id: z.string().uuid('Invalid boundary wall type').nullable().default(null),
  playground_available: z.boolean().default(false),
  library_available: z.boolean().default(false),
  ict_lab_available: z.boolean().default(false),
  science_lab_available: z.boolean().default(false),
  internet_available: z.boolean().default(false),
  ramp_available: z.boolean().default(false),
  kitchen_shed_available: z.boolean().default(false),
  water_functional: z.boolean().default(false),
}).refine(data => data.functional_classrooms <= data.total_classrooms, {
  message: 'Functional classrooms cannot exceed total classrooms',
  path: ['functional_classrooms'],
}).refine(data => data.boys_toilets_functional <= data.boys_toilets, {
  message: "Functional boys' toilets cannot exceed total boys' toilets",
  path: ['boys_toilets_functional'],
}).refine(data => data.girls_toilets_functional <= data.girls_toilets, {
  message: "Functional girls' toilets cannot exceed total girls' toilets",
  path: ['girls_toilets_functional'],
}).refine(data => data.staff_toilets_functional <= data.staff_toilets, {
  message: "Functional staff toilets cannot exceed total staff toilets",
  path: ['staff_toilets_functional'],
}).refine(data => data.classrooms_needing_repair <= data.total_classrooms, {
  message: 'Classrooms needing repair cannot exceed total classrooms',
  path: ['classrooms_needing_repair'],
});

export type InfrastructureMetricsFormValues = z.infer<typeof InfrastructureMetricsSchema>;


// ─── Mandatory Evidence Checker ───────────────────────────────
export const checkMandatoryEvidence = (
  metrics: InfrastructureMetricsFormValues,
  uploadedEvidenceKeys: string[]
): string[] => {
  const missing: string[] = [];

  if (metrics.boys_toilets > 0 && !uploadedEvidenceKeys.includes('boys_toilets')) {
    missing.push('boys_toilets');
  }
  if (metrics.girls_toilets > 0 && !uploadedEvidenceKeys.includes('girls_toilets')) {
    missing.push('girls_toilets');
  }
  if (metrics.electricity_available && !uploadedEvidenceKeys.includes('electricity')) {
    missing.push('electricity');
  }
  if (metrics.drinking_water_available && !uploadedEvidenceKeys.includes('drinking_water')) {
    missing.push('drinking_water');
  }
  if (metrics.building_available && !uploadedEvidenceKeys.includes('building')) {
    missing.push('building');
  }

  return missing;
};


// ─── Default Form Values (for reset) ──────────────────────────
export const DEFAULT_INFRASTRUCTURE_METRICS: InfrastructureMetricsFormValues = {
  // Land
  land_status_id: null,
  land_measurement_kanal: 0,
  land_measurement_marla: null,
  land_remarks: '',

  // Building
  building_available: false,
  total_buildings: 0,
  building_remarks: '',

  // Classrooms
  total_classrooms: 0,
  functional_classrooms: 0,
  non_functional_classrooms: 0,
  classrooms_needing_repair: 0,
  classrooms_dilapidated: 0,

  // Rooms (legacy)
  total_rooms: 0,
  staff_rooms: 0,
  office_room_available: false,

  // HS/HSS
  computer_room_available: false,
  computer_room_functional: false,
  library_room_available: false,
  library_room_functional: false,
  laboratory_room_available: false,
  laboratory_room_functional: false,

  // Toilets
  boys_toilets: 0,
  boys_toilets_functional: 0,
  girls_toilets: 0,
  girls_toilets_functional: 0,
  staff_toilets: 0,
  staff_toilets_functional: 0,
  cwsn_toilet_available: false,
  toilet_remarks: '',
  functional_boys_toilets: 0,
  functional_girls_toilets: 0,

  // Electricity
  electricity_available: false,
  electricity_functional: false,
  electricity_remarks: '',

  // Drinking Water
  drinking_water_available: false,
  drinking_water_functional: false,
  drinking_water_source_id: null,
  drinking_water_remarks: '',

  // Other
  boundary_wall_type_id: null,
  playground_available: false,
  library_available: false,
  ict_lab_available: false,
  science_lab_available: false,
  internet_available: false,
  ramp_available: false,
  kitchen_shed_available: false,
  water_functional: false,
};
