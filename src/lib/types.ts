export interface Company {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  founded_year: number | null;
  industry: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  company_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  is_headquarters: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parent_id: string | null;
  manager_id: string | null;
  location_id: string | null;
  level: number;
  icon: string | null;
  created_at: string;
}

export interface Position {
  id: string;
  title: string;
  department_id: string | null;
  description: string | null;
  responsibilities: string[] | null;
  decision_rights: string | null;
  requirements: string[] | null;
  level: string | null;
  min_salary: number | null;
  max_salary: number | null;
  is_vacant: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position_id: string | null;
  department_id: string | null;
  manager_id: string | null;
  location_id: string | null;
  avatar_url: string | null;
  competencies: string[] | null;
  specializations: string[] | null;
  hire_date: string | null;
  status: 'active' | 'on_leave' | 'terminated';
  is_board_member: boolean;
  salary: number | null;
  leave_used_days: number | null;
  sick_days: number | null;
  created_at: string;
}

export interface Substitution {
  id: string;
  employee_id: string;
  substitute_id: string;
  start_date: string;
  end_date: string | null;
  reason: string | null;
  status: 'active' | 'ended' | 'scheduled';
  created_at: string;
}

export interface Process {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  created_at: string;
}

export interface ProcessDepartment {
  process_id: string;
  department_id: string;
  role: string | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'regulation' | 'procedure' | 'policy' | 'instruction';
  description: string | null;
  department_id: string | null;
  file_url: string | null;
  version: string | null;
  effective_date: string | null;
  status: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[] | null;
  color: string | null;
  created_at: string;
}

export interface AccessControl {
  id: string;
  role_id: string;
  resource: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  created_at: string;
}

export interface ChangeHistory {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: 'create' | 'update' | 'delete';
  changed_by: string | null;
  summary: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: string | null;
  title: string;
  type: string;
  description: string | null;
  file_url: string | null;
  effective_date: string | null;
  status: string | null;
  department_id: string | null;
  archived_by: string | null;
  archived_at: string;
}

// ============ Performance Management ============
export interface PerformanceGoal {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  goal_type: 'quarter' | 'okr';
  quarter: string | null;
  target_date: string | null;
  progress: number;
  status: 'active' | 'completed' | 'overdue';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period: string | null;
  review_type: 'periodic' | 'okr' | 'annual';
  manager_rating: number | null;
  self_rating: number | null;
  manager_feedback: string | null;
  self_assessment: string | null;
  status: 'draft' | 'submitted' | 'acknowledged';
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceGoalWithRelations extends PerformanceGoal {
  employee?: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
}

export interface PerformanceReviewWithRelations extends PerformanceReview {
  employee?: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
}

// Joined / derived views
export interface EmployeeWithRelations extends Employee {
  position?: Position | null;
  department?: { id: string; name: string; code: string | null } | null;
  manager?: Pick<Employee, 'id' | 'first_name' | 'last_name'> | null;
  location?: Pick<Location, 'id' | 'name' | 'city'> | null;
}

export interface DepartmentWithRelations extends Department {
  parent?: Pick<Department, 'id' | 'name'> | null;
  manager?: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
  location?: Pick<Location, 'id' | 'name' | 'city'> | null;
  employee_count?: number;
}

export interface ProcessWithRelations extends Process {
  owner?: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
  departments?: Array<{ id: string; name: string; role: string | null }>;
}

export interface DepartmentNode extends DepartmentWithRelations {
  children: DepartmentNode[];
}
