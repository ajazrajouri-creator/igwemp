// ============================================================
// IGWEMP — Global TypeScript Types
// Foundation Layer — Core Domain Types
// ============================================================

// ─── Utility ─────────────────────────────────────────────────
export type UUID = string;
export type DateString = string; // ISO 8601
export type JSONBValue = Record<string, unknown>;

// ─── Tenant ──────────────────────────────────────────────────
export interface Tenant {
  id: UUID;
  code: string;        // SED, HEALTH, AGRI, RDD, MUN
  name: string;
  config: TenantConfig;
  is_active: boolean;
  created_at: DateString;
  updated_at: DateString;
}

export interface TenantConfig {
  display_name: string;
  short_code: string;
  locale: string;
  timezone: string;
  fiscal_year_start_month: number;
  order_reference_prefix: string;
  mfa_required: boolean;
  mfa_methods: ('TOTP' | 'OTP' | 'BIOMETRIC')[];
  allowed_ip_ranges?: string[];
  features: Record<string, boolean>;
  notification_channels: ('IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP')[];
  audit_retention_years: number;
  document_storage_bucket: string;
}

// ─── Party (S4) ──────────────────────────────────────────────
export type PartyType = 'PERSON' | 'ORG' | 'OFFICE' | 'SCHOOL' | 'COMMITTEE';

export interface Party {
  id: UUID;
  tenant_id: UUID;
  party_type: PartyType;
  display_name: string;
  is_active: boolean;
  deleted_at: DateString | null;
  created_at: DateString;
  updated_at: DateString;
}

export interface PersonParty extends Party {
  party_type: 'PERSON';
  first_name: string;
  last_name: string | null;
  dob: DateString | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  aadhaar_hash: string | null;
  aadhaar_last4: string | null;
  pan_hash: string | null;
  pan_masked: string | null;
}

export interface OrgParty extends Party {
  party_type: 'ORG';
  org_type: string;
  registration_number: string | null;
}

// ─── Identity & Auth (S4) ─────────────────────────────────────
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface UserAccount {
  id: UUID;
  tenant_id: UUID;
  party_id: UUID | null;
  supabase_auth_id: string;
  username: string | null;
  status: UserStatus;
  last_login_at: DateString | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  party?: PersonParty;
}

export interface UserPreference {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  email_notifications: boolean;
  in_app_notifications: boolean;
  queue_alerts: boolean;
  escalation_alerts: boolean;
  created_at: DateString;
  updated_at: DateString;
}

// ─── Employee Foundation (S4) ─────────────────────────────────
export interface EmployeeProfile {
  id: UUID;
  tenant_id: UUID;
  person_party_id: UUID;
  employee_code: string;
  joining_date: DateString | null;
  status: string;
  created_at: DateString;
  updated_at: DateString;
  // joined
  person?: PersonParty;
}

// ─── Hierarchy & Organization ─────────────────────────────────
export interface HierarchyLevel {
  id: UUID;
  tenant_id: UUID;
  level_code: string;
  level_name: string;
  sort_order: number;
  parent_level_id: UUID | null;
  created_at: DateString;
  updated_at: DateString;
}

export interface Office {
  id: UUID;
  tenant_id: UUID;
  office_code: string;
  office_name: string;
  level_id: UUID;
  parent_office_id: UUID | null;
  path: string | null; // ltree path
  office_subtype: 'DEFAULT' | 'SCHOOL' | 'DIRECTORATE' | 'DISTRICT' | 'ZONE';
  is_active: boolean;
  address: string | null;
  deleted_at: DateString | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  level?: HierarchyLevel;
  parent?: Office;
  sections?: Section[];
}

// ─── Section ──────────────────────────────────────────────────
export type SectionType = 'ESTABLISHMENT' | 'ACADEMIC' | 'ACCOUNTS' | 'INFRASTRUCTURE' | 'SCHOLARSHIP' | 'LEGAL' | 'CONFIDENTIAL' | 'PLANNING' | 'GENERAL' | 'CUSTOM';

export interface Section {
  id: UUID;
  tenant_id: UUID;
  office_id: UUID;
  section_type: SectionType;
  section_name: string;
  head_user_id: UUID | null;
  queue_enabled: boolean;
  is_active: boolean;
  deleted_at: DateString | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  office?: Office;
  head?: UserAccount;
}

export type SectionRole = 'HEAD' | 'SENIOR_OFFICER' | 'OFFICER' | 'CLERK' | 'READ_ONLY';

export interface SectionMembership {
  id: UUID;
  tenant_id: UUID;
  section_id: UUID;
  user_id: UUID;
  section_role: SectionRole;
  effective_from: DateString;
  effective_to: DateString | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  section?: Section;
  user?: UserAccount;
}

// ─── Role & Policy Engine (S4) ────────────────────────────────
export interface Role {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  hierarchy_weight: number;
  created_at: DateString;
  updated_at: DateString;
}

export interface Policy {
  id: UUID;
  tenant_id: UUID;
  code: string;
  description: string | null;
  module: string;
  action: string;
  created_at: DateString;
  updated_at: DateString;
}

export interface RoleAssignment {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  role_id: UUID;
  office_id: UUID | null;
  section_id: UUID | null;
  effective_from: DateString;
  effective_to: DateString | null;
  assigned_by: UUID | null;
  assignment_reason: string | null;
  assigned_order_id: UUID | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  role?: Role;
  scopes?: RoleAssignmentScope[];
}

export interface RoleAssignmentScope {
  id: UUID;
  tenant_id: UUID;
  assignment_id: UUID;
  scope_category_id: UUID;
  scope_item_id: UUID;
  created_at: DateString;
  // joined
  item?: MasterDataItem;
}

// ─── Delegation of Authority (S4) ─────────────────────────────
export type DelegationType = 'FULL' | 'PARTIAL' | 'APPROVAL_ONLY' | 'SIGNING_ONLY' | 'CUSTOM';
export type DelegationStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface DelegationOfAuthority {
  id: UUID;
  tenant_id: UUID;
  delegated_by: UUID;
  delegated_to: UUID;
  delegation_type: DelegationType;
  effective_from: DateString;
  effective_to: DateString;
  status: DelegationStatus;
  created_at: DateString;
  updated_at: DateString;
  // joined
  delegator?: UserAccount;
  delegate?: UserAccount;
  scopes?: DelegationScope[];
}

export interface DelegationScope {
  id: UUID;
  tenant_id: UUID;
  delegation_id: UUID;
  module: string;
  action: string;
  scope_item_id: UUID | null;
  created_at: DateString;
}

// ─── Responsibility Engine (S4) ───────────────────────────────
export interface ResponsibilityType {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  category: string;
  is_exclusive: boolean;
  is_active: boolean;
  created_at: DateString;
  updated_at: DateString;
}

export type ResponsibilityStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export interface PersonResponsibility {
  id: UUID;
  tenant_id: UUID;
  person_id: UUID;
  resp_type_id: UUID;
  office_id: UUID | null;
  effective_from: DateString;
  effective_to: DateString | null;
  status: ResponsibilityStatus;
  assigned_by: UUID | null;
  linked_order_id: UUID | null;
  remarks: string | null;
  priority: number;
  created_at: DateString;
  updated_at: DateString;
  // joined
  responsibility_type?: ResponsibilityType;
}

// ─── Master Data ──────────────────────────────────────────────
export interface MasterDataCategory {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: DateString;
  updated_at: DateString;
}

export interface MasterDataItem {
  id: UUID;
  tenant_id: UUID;
  category_id: UUID;
  parent_item_id: UUID | null;
  code: string;
  name: string;
  sort_order: number;
  metadata: JSONBValue;
  is_active: boolean;
  effective_from: DateString;
  effective_to: DateString | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  category?: MasterDataCategory;
  parent?: MasterDataItem;
}

// ─── Audit ────────────────────────────────────────────────────
export interface AuditLog {
  id: UUID;
  tenant_id: UUID;
  entity_type: string;
  entity_id: UUID;
  action: string;
  old_values: JSONBValue | null;
  new_values: JSONBValue | null;
  performed_by: UUID | null;
  performed_at: DateString;
  // joined
  actor?: UserAccount;
}

// ============================================================
// Sprint S5 - Governance Workflow Foundation
// ============================================================

// ─── Document Engine ─────────────────────────────────────────
export interface Document {
  id: UUID;
  tenant_id: UUID;
  title: string;
  document_type: string;
  created_at: DateString;
  updated_at: DateString;
}

export interface DocumentVersion {
  id: UUID;
  document_id: UUID;
  version_number: number;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: UUID | null;
  created_at: DateString;
  // joined
  document?: Document;
}

export interface DocumentLink {
  id: UUID;
  document_id: UUID;
  linked_entity_type: string;
  linked_entity_id: UUID;
  created_at: DateString;
  // joined
  document?: Document;
}

// ─── Workflow Engine ─────────────────────────────────────────
export interface WorkflowDefinition {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  module: string;
  created_at: DateString;
  updated_at: DateString;
}

export interface WorkflowVersion {
  id: UUID;
  workflow_id: UUID;
  version_number: number;
  is_active: boolean;
  created_at: DateString;
  // joined
  definition?: WorkflowDefinition;
}

export type WorkflowStateType = 'START' | 'IN_PROGRESS' | 'WAITING' | 'END';

export interface WorkflowState {
  id: UUID;
  workflow_version_id: UUID;
  name: string;
  state_type: WorkflowStateType;
  created_at: DateString;
}

export interface WorkflowTransition {
  id: UUID;
  workflow_version_id: UUID;
  from_state_id: UUID;
  to_state_id: UUID;
  action_name: string;
  required_role_id: UUID | null;
  created_at: DateString;
}

// ─── Order Engine ────────────────────────────────────────────
export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type OrderStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED' | 'WITHDRAWN';

export interface Order {
  id: UUID;
  tenant_id: UUID;
  order_number: string;
  order_type_id: UUID;
  issue_date: DateString;
  effective_date: DateString | null;
  priority: OrderPriority;
  status: OrderStatus;
  issuing_office_id: UUID;
  issuing_user_id: UUID;
  created_at: DateString;
  updated_at: DateString;
  // joined
  issuing_office?: Office;
  issuing_user?: UserAccount;
  order_type?: MasterDataItem;
}

// ─── Case Engine & Work Queue ─────────────────────────────────
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'RETURNED' | 'ESCALATED' | 'CLOSED' | 'REJECTED';
export type WorkItemStatus = 'INBOX' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'ESCALATED';

export interface Case {
  id: UUID;
  tenant_id: UUID;
  parent_case_id: UUID | null;
  parent_order_id: UUID | null;
  case_type_id: UUID;
  workflow_version_id: UUID | null;
  current_state_id: UUID | null;
  status: CaseStatus;
  due_date: DateString | null;
  priority: OrderPriority;
  created_at: DateString;
  updated_at: DateString;
  // joined
  parent_case?: Case;
  parent_order?: Order;
  case_type?: MasterDataItem;
  current_state?: WorkflowState;
}

export interface WorkItem {
  id: UUID;
  tenant_id: UUID;
  case_id: UUID;
  assigned_user_id: UUID | null;
  assigned_section_id: UUID | null;
  assigned_office_id: UUID | null;
  status: WorkItemStatus;
  due_date: DateString | null;
  picked_up_by: UUID | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  case?: Case;
  assigned_user?: UserAccount;
  assigned_section?: Section;
  assigned_office?: Office;
  picked_up_by_user?: UserAccount;
}

// ─── Action Taken Report Engine ──────────────────────────────
export type ATRStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'RETURNED';

export interface ActionTakenReport {
  id: UUID;
  tenant_id: UUID;
  case_id: UUID;
  work_item_id: UUID | null;
  submitted_by: UUID;
  narrative: string;
  submission_date: DateString;
  atr_status: ATRStatus;
  verification_remarks: string | null;
  approved_by: UUID | null;
  approved_at: DateString | null;
  created_at: DateString;
  updated_at: DateString;
  // joined
  case?: Case;
  submitter?: UserAccount;
  approver?: UserAccount;
}

// ─── Escalation Rule Engine ──────────────────────────────────
export type EscalationRuleType = 'REMINDER' | 'ESCALATION';

export interface EscalationRule {
  id: UUID;
  tenant_id: UUID;
  case_type_id: UUID | null;
  priority: OrderPriority | null;
  rule_type: EscalationRuleType;
  trigger_days: number;
  escalation_level: number;
  escalate_to_role_id: UUID | null;
  created_at: DateString;
  updated_at: DateString;
}

export interface Escalation {
  id: UUID;
  tenant_id: UUID;
  case_id: UUID;
  work_item_id: UUID;
  rule_id: UUID;
  escalated_by_system: boolean;
  escalated_to_user_id: UUID | null;
  reason: string;
  status: 'ACTIVE' | 'RESOLVED' | 'IGNORED';
  created_at: DateString;
  updated_at: DateString;
  // joined
  rule?: EscalationRule;
  escalated_to?: UserAccount;
}

// ─── Notification Engine ─────────────────────────────────────
export interface NotificationTemplate {
  id: UUID;
  tenant_id: UUID;
  code: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject_template: string;
  body_template: string;
  created_at: DateString;
  updated_at: DateString;
}

export interface Notification {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  template_id: UUID | null;
  content: string;
  is_read: boolean;
  created_at: DateString;
}

// ─── Dynamic Form Foundation ─────────────────────────────────
export interface FormTemplate {
  id: UUID;
  tenant_id: UUID;
  code: string;
  name: string;
  created_at: DateString;
  updated_at: DateString;
}

export interface FormField {
  id: UUID;
  form_template_id: UUID;
  field_name: string;
  field_type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'FILE';
  is_required: boolean;
  validation_rules: JSONBValue | null;
  sort_order: number;
  created_at: DateString;
}

// ─── Assignment Templates ────────────────────────────────────
export interface AssignmentTemplate {
  id: UUID;
  tenant_id: UUID;
  name: string;
  description: string | null;
  workflow_id: UUID | null;
  generated_order_type_id: UUID | null;
  created_at: DateString;
  updated_at: DateString;
}

export interface TemplateTask {
  id: UUID;
  template_id: UUID;
  task_name: string;
  default_assignee_role_id: UUID | null;
  sla_days: number | null;
  created_at: DateString;
}

// ─── Employee Foundation (S6) ─────────────────────────────────
export type EmploymentStatus = 'ACTIVE' | 'RETIRED' | 'SUSPENDED' | 'TERMINATED' | 'RESIGNED' | 'DECEASED';

export interface EmployeeProfileExt extends EmployeeProfile {
  department_employee_id: string | null;
  employment_status: EmploymentStatus;
  date_of_initial_appointment: DateString | null;
  date_of_retirement: DateString | null;
  employee_category_id: UUID | null;
  cadre_id: UUID | null;
  designation_id: UUID | null;
  current_office_id: UUID | null;
  deleted_at: DateString | null;
  deleted_by: UUID | null;
  delete_reason: string | null;
  record_version: number;
}

export interface EmployeeServiceRecord {
  id: UUID;
  tenant_id: UUID;
  employee_id: UUID;
  appointment_type_id: UUID | null;
  recruitment_mode_id: UUID | null;
  service_type_id: UUID | null;
  substantive_post_id: UUID | null;
  pay_level_id: UUID | null;
  effective_from: DateString;
  effective_to: DateString | null;
  status: 'ACTIVE' | 'SUPERSEDED' | 'CANCELLED';
  approved_by: UUID | null;
  approved_at: DateString | null;
  linked_order_id: UUID | null;
  record_version: number;
  created_at: DateString;
  updated_at: DateString;
}

export type PostingNature = 'SUBSTANTIVE' | 'TEMPORARY' | 'CONTRACTUAL' | 'PROBATION' | 'TRANSFERRED';

export interface EmployeePosting {
  id: UUID;
  tenant_id: UUID;
  employee_id: UUID;
  office_id: UUID;
  post_type_id: UUID | null;
  posting_nature: PostingNature;
  effective_from: DateString;
  effective_to: DateString | null;
  joining_date: DateString | null;
  relieving_date: DateString | null;
  joining_order_id: UUID | null;
  relieving_order_id: UUID | null;
  status: 'ACTIVE' | 'RELIEVED' | 'CANCELLED';
  approved_by: UUID | null;
  approved_at: DateString | null;
  record_version: number;
  created_at: DateString;
  updated_at: DateString;
  // joined
  office?: Office;
}

export type WorkingArrangementType = 'ATTACHED' | 'DEPLOYED' | 'ADDITIONAL_CHARGE' | 'TEMPORARY_DUTY' | 'TRAINING' | 'LEAVE_SUBSTITUTE';

export interface EmployeeWorkingArrangement {
  id: UUID;
  tenant_id: UUID;
  employee_id: UUID;
  arrangement_type: WorkingArrangementType;
  parent_posting_id: UUID | null;
  working_office_id: UUID;
  effective_from: DateString;
  effective_to: DateString | null;
  linked_order_id: UUID | null;
  issued_by: UUID | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  remarks: string | null;
  record_version: number;
  created_at: DateString;
  updated_at: DateString;
  // joined
  working_office?: Office;
}

export interface EmployeeChangeRequest {
  id: UUID;
  tenant_id: UUID;
  employee_id: UUID;
  requested_by: UUID;
  request_type: string;
  reason: string | null;
  case_id: UUID | null;
  workflow_version_id: UUID | null;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  submitted_at: DateString | null;
  approved_at: DateString | null;
  approved_by: UUID | null;
  record_version: number;
  created_at: DateString;
  updated_at: DateString;
}

export interface EmployeeChangeRequestItem {
  id: UUID;
  tenant_id: UUID;
  change_request_id: UUID;
  target_entity_type: 'PROFILE' | 'SERVICE' | 'POSTING' | 'ARRANGEMENT' | 'QUALIFICATION' | 'SUBJECT' | 'DOCUMENT';
  target_record_id: UUID | null;
  operation: 'CREATE' | 'UPDATE' | 'CLOSE' | 'CORRECT';
  proposed_values: JSONBValue;
  existing_record_version: number | null;
  status: 'PENDING' | 'APPLIED' | 'FAILED' | 'REJECTED';
  created_at: DateString;
  updated_at: DateString;
}
