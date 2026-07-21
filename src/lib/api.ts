import { supabase } from './supabase';
import type {
  Company,
  Location,
  Department,
  DepartmentNode,
  DepartmentWithRelations,
  Position,
  Employee,
  EmployeeWithRelations,
  Substitution,
  Process,
  ProcessDepartment,
  ProcessWithRelations,
  DocumentItem,
  DocumentVersion,
  UserRole,
  AccessControl,
  ChangeHistory,
  PerformanceGoal,
  PerformanceReview,
  PerformanceGoalWithRelations,
  PerformanceReviewWithRelations,
} from './types';

// ============ Company ============
export async function fetchCompany(): Promise<Company | null> {
  const { data, error } = await supabase.from('companies').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data as Company | null;
}

// ============ Locations ============
export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from('locations').select('*').order('is_headquarters', { ascending: false }).order('name');
  if (error) throw error;
  return (data ?? []) as Location[];
}

// ============ Departments ============
// Fetch flat departments + locations, then resolve parent/manager in JS
// (PostgREST schema cache cannot resolve self-referencing FKs, so we avoid
// parent:departments and manager:employees joins here).
export async function fetchDepartments(): Promise<DepartmentWithRelations[]> {
  const [deptRes, empRes, locRes, countRes] = await Promise.all([
    supabase.from('departments').select('*').order('level').order('name'),
    supabase.from('employees').select('id,first_name,last_name,avatar_url'),
    supabase.from('locations').select('id,name,city'),
    supabase.from('employees').select('department_id'),
  ]);
  if (deptRes.error) throw deptRes.error;
  if (empRes.error) throw empRes.error;
  if (locRes.error) throw locRes.error;
  if (countRes.error) throw countRes.error;

  const depts = (deptRes.data ?? []) as Department[];
  const empMap = new Map<string, { id: string; first_name: string; last_name: string; avatar_url: string | null }>();
  for (const e of (empRes.data ?? []) as Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'>[]) {
    empMap.set(e.id, { id: e.id, first_name: e.first_name, last_name: e.last_name, avatar_url: e.avatar_url });
  }
  const locMap = new Map<string, { id: string; name: string; city: string | null }>();
  for (const l of (locRes.data ?? []) as Location[]) locMap.set(l.id, { id: l.id, name: l.name, city: l.city });
  const countMap = new Map<string, number>();
  for (const row of (countRes.data ?? []) as { department_id: string | null }[]) {
    if (row.department_id) countMap.set(row.department_id, (countMap.get(row.department_id) ?? 0) + 1);
  }
  const deptMap = new Map<string, Department>();
  for (const d of depts) deptMap.set(d.id, d);

  return depts.map((d) => ({
    ...d,
    parent: d.parent_id ? (deptMap.get(d.parent_id) ? { id: deptMap.get(d.parent_id)!.id, name: deptMap.get(d.parent_id)!.name } : null) : null,
    manager: d.manager_id ? empMap.get(d.manager_id) ?? null : null,
    location: d.location_id ? locMap.get(d.location_id) ?? null : null,
    employee_count: countMap.get(d.id) ?? 0,
  }));
}

export function buildDepartmentTree(departments: DepartmentWithRelations[]): DepartmentNode[] {
  const byId = new Map<string, DepartmentNode>();
  departments.forEach((d) => byId.set(d.id, { ...d, children: [] }));
  const roots: DepartmentNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function flattenDepartmentTree(roots: DepartmentNode[]): DepartmentNode[] {
  const out: DepartmentNode[] = [];
  const walk = (nodes: DepartmentNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ ...n, level: depth });
      walk(n.children, depth + 1);
    }
  };
  walk(roots, 0);
  return out;
}

// ============ Positions ============
export async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase.from('positions').select('*').order('level').order('title');
  if (error) throw error;
  return (data ?? []) as Position[];
}

// ============ Employees ============
// Fetch flat employees + positions + departments + locations, then resolve
// manager (self-ref) in JS — PostgREST cannot resolve employees!manager_id.
export async function fetchEmployees(): Promise<EmployeeWithRelations[]> {
  const [empRes, posRes, deptRes, locRes] = await Promise.all([
    supabase.from('employees').select('*').order('last_name').order('first_name'),
    supabase.from('positions').select('*'),
    supabase.from('departments').select('id,name,code'),
    supabase.from('locations').select('id,name,city'),
  ]);
  if (empRes.error) throw empRes.error;
  if (posRes.error) throw posRes.error;
  if (deptRes.error) throw deptRes.error;
  if (locRes.error) throw locRes.error;

  const emps = (empRes.data ?? []) as Employee[];
  const posMap = new Map<string, Position>();
  for (const p of (posRes.data ?? []) as Position[]) posMap.set(p.id, p);
  const deptMap = new Map<string, { id: string; name: string; code: string | null }>();
  for (const d of (deptRes.data ?? []) as { id: string; name: string; code: string | null }[]) deptMap.set(d.id, d);
  const locMap = new Map<string, { id: string; name: string; city: string | null }>();
  for (const l of (locRes.data ?? []) as { id: string; name: string; city: string | null }[]) locMap.set(l.id, l);
  const empMap = new Map<string, Employee>();
  for (const e of emps) empMap.set(e.id, e);

  return emps.map((e) => ({
    ...e,
    position: e.position_id ? posMap.get(e.position_id) ?? null : null,
    department: e.department_id ? deptMap.get(e.department_id) ?? null : null,
    manager: e.manager_id && empMap.has(e.manager_id)
      ? { id: empMap.get(e.manager_id)!.id, first_name: empMap.get(e.manager_id)!.first_name, last_name: empMap.get(e.manager_id)!.last_name }
      : null,
    location: e.location_id ? locMap.get(e.location_id) ?? null : null,
  }));
}

export async function fetchEmployeeById(id: string): Promise<EmployeeWithRelations | null> {
  // Reuse fetchEmployees and find — avoids a separate self-ref join query.
  const all = await fetchEmployees();
  return all.find((e) => e.id === id) ?? null;
}

export async function fetchSubordinates(managerId: string): Promise<EmployeeWithRelations[]> {
  const all = await fetchEmployees();
  return all.filter((e) => e.manager_id === managerId);
}

// ============ Substitutions ============
export async function fetchSubstitutions(): Promise<(Substitution & {
  employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'>;
  substitute: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'>;
})[]> {
  const { data, error } = await supabase
    .from('substitutions')
    .select(
      '*, employee:employees!substitutions_employee_id_fkey(id,first_name,last_name,avatar_url), substitute:employees!substitutions_substitute_id_fkey(id,first_name,last_name,avatar_url)'
    )
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Array<
    Substitution & {
      employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'>;
      substitute: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'avatar_url'>;
    }
  >;
}

// ============ Processes ============
export async function fetchProcesses(): Promise<ProcessWithRelations[]> {
  const { data, error } = await supabase
    .from('processes')
    .select('*, owner:employees!owner_id(id,first_name,last_name,avatar_url)')
    .order('priority', { ascending: false })
    .order('name');
  if (error) throw error;
  const procs = (data ?? []) as unknown as ProcessWithRelations[];

  const { data: links, error: linksErr } = await supabase.from('process_departments').select('process_id, department_id, role, departments!process_departments_department_id_fkey(id,name)');
  if (linksErr) throw linksErr;
  const linkMap = new Map<string, ProcessWithRelations['departments']>();
  for (const l of (links ?? []) as unknown as Array<{
    process_id: string;
    department_id: string;
    role: string | null;
    departments: { id: string; name: string } | null;
  }>) {
    if (!linkMap.has(l.process_id)) linkMap.set(l.process_id, []);
    if (l.departments) linkMap.get(l.process_id)!.push({ id: l.departments.id, name: l.departments.name, role: l.role });
  }
  return procs.map((p) => ({ ...p, departments: linkMap.get(p.id) ?? [] }));
}

export async function fetchProcessDepartmentLinks(): Promise<ProcessDepartment[]> {
  const { data, error } = await supabase.from('process_departments').select('*');
  if (error) throw error;
  return (data ?? []) as ProcessDepartment[];
}

// ============ Documents ============
export async function fetchDocuments(): Promise<(DocumentItem & {
  department: Pick<Department, 'id' | 'name'> | null;
})[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*, department:departments!documents_department_id_fkey(id,name)')
    .order('type')
    .order('title');
  if (error) throw error;
  return (data ?? []) as unknown as Array<DocumentItem & { department: Pick<Department, 'id' | 'name'> | null }>;
}

// ============ User roles & access ============
export async function fetchUserRoles(): Promise<UserRole[]> {
  const { data, error } = await supabase.from('user_roles').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as UserRole[];
}

export async function fetchAccessControls(): Promise<AccessControl[]> {
  const { data, error } = await supabase.from('access_controls').select('*').order('resource');
  if (error) throw error;
  return (data ?? []) as AccessControl[];
}

// ============ Change history ============
export async function fetchChangeHistory(limit = 50): Promise<ChangeHistory[]> {
  const { data, error } = await supabase
    .from('change_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ChangeHistory[];
}

// ============ Full org snapshot (for dashboard / analytics) ============
export interface OrgSnapshot {
  company: Company | null;
  locations: Location[];
  departments: DepartmentWithRelations[];
  positions: Position[];
  employees: EmployeeWithRelations[];
  processes: ProcessWithRelations[];
  documents: DocumentItem[];
  roles: UserRole[];
  accessControls: AccessControl[];
  changeHistory: ChangeHistory[];
  substitutions: Awaited<ReturnType<typeof fetchSubstitutions>>;
  goals: PerformanceGoalWithRelations[];
  reviews: PerformanceReviewWithRelations[];
}

export async function fetchOrgSnapshot(): Promise<OrgSnapshot> {
  const [
    company,
    locations,
    departments,
    positions,
    employees,
    processes,
    documentsWithDeps,
    roles,
    accessControls,
    changeHistory,
    substitutions,
    goals,
    reviews,
  ] = await Promise.all([
    fetchCompany(),
    fetchLocations(),
    fetchDepartments(),
    fetchPositions(),
    fetchEmployees(),
    fetchProcesses(),
    fetchDocuments(),
    fetchUserRoles(),
    fetchAccessControls(),
    fetchChangeHistory(),
    fetchSubstitutions(),
    fetchGoals(),
    fetchReviews(),
  ]);
  return {
    company,
    locations,
    departments,
    positions,
    employees,
    processes,
    documents: documentsWithDeps.map(({ department, ...d }) => d),
    roles,
    accessControls,
    changeHistory,
    substitutions,
    goals,
    reviews,
  };
}

// ============ Audit logging ============
function errMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message);
  if (typeof err === 'string') return err;
  return 'Nieznany błąd';
}

export async function logChange(params: {
  entity_type: string;
  entity_id?: string | null;
  action: 'create' | 'update' | 'delete';
  summary: string;
  changes?: Record<string, unknown> | null;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('change_history').insert({
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    action: params.action,
    changed_by: user?.email ?? null,
    summary: params.summary,
    changes: params.changes ?? null,
  });
  if (error) console.error('logChange failed:', error.message);
}

// ============ Employees CRUD ============
export type EmployeeInput = {
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
};

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const { data, error } = await supabase.from('employees').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({
    entity_type: 'employee',
    entity_id: data.id,
    action: 'create',
    summary: `Dodano pracownika: ${data.first_name} ${data.last_name}`,
  });
  return data as Employee;
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').update(input).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({
    entity_type: 'employee',
    entity_id: id,
    action: 'update',
    summary: `Zaktualizowano pracownika: ${data.first_name} ${data.last_name}`,
    changes: input,
  });
  return data as Employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'employee', entity_id: id, action: 'delete', summary: 'Usunięto pracownika' });
}

// ============ Positions CRUD ============
export type PositionInput = {
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
};

export async function createPosition(input: PositionInput): Promise<Position> {
  const { data, error } = await supabase.from('positions').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'position', entity_id: data.id, action: 'create', summary: `Dodano stanowisko: ${data.title}` });
  return data as Position;
}

export async function updatePosition(id: string, input: Partial<PositionInput>): Promise<Position> {
  const { data, error } = await supabase.from('positions').update(input).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'position', entity_id: id, action: 'update', summary: `Zaktualizowano stanowisko: ${data.title}`, changes: input });
  return data as Position;
}

export async function deletePosition(id: string): Promise<void> {
  const { error } = await supabase.from('positions').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'position', entity_id: id, action: 'delete', summary: 'Usunięto stanowisko' });
}

// ============ Processes CRUD ============
export type ProcessInput = {
  name: string;
  description: string | null;
  owner_id: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
};

export async function createProcess(input: ProcessInput): Promise<Process> {
  const { data, error } = await supabase.from('processes').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'process', entity_id: data.id, action: 'create', summary: `Dodano proces: ${data.name}` });
  return data as Process;
}

export async function updateProcess(id: string, input: Partial<ProcessInput>): Promise<Process> {
  const { data, error } = await supabase.from('processes').update(input).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'process', entity_id: id, action: 'update', summary: `Zaktualizowano proces: ${data.name}`, changes: input });
  return data as Process;
}

export async function deleteProcess(id: string): Promise<void> {
  const { error } = await supabase.from('processes').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'process', entity_id: id, action: 'delete', summary: 'Usunięto proces' });
}

// ============ Documents CRUD + version history ============
export type DocumentInput = {
  title: string;
  type: 'regulation' | 'procedure' | 'policy' | 'instruction';
  description: string | null;
  department_id: string | null;
  file_url: string | null;
  version: string | null;
  effective_date: string | null;
  status: string | null;
};

export async function fetchDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('archived_at', { ascending: false });
  if (error) throw new Error(errMessage(error));
  return (data ?? []) as DocumentVersion[];
}

export async function createDocument(input: DocumentInput): Promise<DocumentItem> {
  const { data, error } = await supabase.from('documents').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'document', entity_id: data.id, action: 'create', summary: `Dodano dokument: ${data.title}` });
  return data as DocumentItem;
}

export async function updateDocument(id: string, input: Partial<DocumentInput>): Promise<DocumentItem> {
  // Archive the current row as a version snapshot before applying changes.
  const { data: current, error: fetchErr } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
  if (fetchErr) throw new Error(errMessage(fetchErr));
  if (current) {
    const c = current as DocumentItem;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: vErr } = await supabase.from('document_versions').insert({
      document_id: id,
      version: c.version,
      title: c.title,
      type: c.type,
      description: c.description,
      file_url: c.file_url,
      effective_date: c.effective_date,
      status: c.status,
      department_id: c.department_id,
      archived_by: user?.email ?? null,
    });
    if (vErr) console.error('archive version failed:', vErr.message);
  }
  const { data, error } = await supabase.from('documents').update(input).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'document', entity_id: id, action: 'update', summary: `Zaktualizowano dokument: ${data.title}`, changes: input });
  return data as DocumentItem;
}

export async function restoreDocumentVersion(versionId: string): Promise<DocumentItem> {
  const { data: version, error: vErr } = await supabase
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle();
  if (vErr) throw new Error(errMessage(vErr));
  if (!version) throw new Error('Wersja nie została znaleziona');
  const v = version as DocumentVersion;
  return updateDocument(v.document_id, {
    version: v.version,
    title: v.title,
    type: v.type as DocumentInput['type'],
    description: v.description,
    file_url: v.file_url,
    effective_date: v.effective_date,
    status: v.status,
    department_id: v.department_id,
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const { error: dvErr } = await supabase.from('document_versions').delete().eq('document_id', id);
  if (dvErr) console.error('delete versions failed:', dvErr.message);
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'document', entity_id: id, action: 'delete', summary: 'Usunięto dokument' });
}

// ============ Performance Management: Goals ============
export type GoalInput = Omit<PerformanceGoal, 'id' | 'created_at' | 'updated_at'>;

export async function fetchGoals(): Promise<PerformanceGoalWithRelations[]> {
  const { data, error } = await supabase
    .from('performance_goals')
    .select('*, employee:employees(id,first_name,last_name,avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(errMessage(error));
  return (data ?? []) as PerformanceGoalWithRelations[];
}

export async function createGoal(input: GoalInput): Promise<PerformanceGoal> {
  const { data, error } = await supabase.from('performance_goals').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'goal', entity_id: data.id, action: 'create', summary: `Dodano cel: ${input.title}` });
  return data as PerformanceGoal;
}

export async function updateGoal(id: string, input: Partial<GoalInput>): Promise<PerformanceGoal> {
  const { data, error } = await supabase.from('performance_goals').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  return data as PerformanceGoal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('performance_goals').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'goal', entity_id: id, action: 'delete', summary: 'Usunięto cel' });
}

// ============ Performance Management: Reviews ============
export type ReviewInput = Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'>;

export async function fetchReviews(): Promise<PerformanceReviewWithRelations[]> {
  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*, employee:employees(id,first_name,last_name,avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(errMessage(error));
  return (data ?? []) as PerformanceReviewWithRelations[];
}

export async function createReview(input: ReviewInput): Promise<PerformanceReview> {
  const { data, error } = await supabase.from('performance_reviews').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'review', entity_id: data.id, action: 'create', summary: `Dodano ocenę: ${input.review_period ?? input.review_type}` });
  return data as PerformanceReview;
}

export async function updateReview(id: string, input: Partial<ReviewInput>): Promise<PerformanceReview> {
  const { data, error } = await supabase.from('performance_reviews').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  return data as PerformanceReview;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('performance_reviews').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'review', entity_id: id, action: 'delete', summary: 'Usunięto ocenę' });
}

// ============ Structure: reorder / reparent departments ============
export async function reparentDepartment(id: string, parentId: string | null): Promise<void> {
  const { error } = await supabase.from('departments').update({ parent_id: parentId }).eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'department', entity_id: id, action: 'update', summary: parentId ? `Przeniesiono dział pod nowego rodzica` : 'Przeniesiono dział na poziom główny' });
}

export async function reassignManager(departmentId: string, managerId: string | null): Promise<void> {
  const { error } = await supabase.from('departments').update({ manager_id: managerId }).eq('id', departmentId);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'department', entity_id: departmentId, action: 'update', summary: 'Zmieniono kierownika działu' });
}

export async function setEmployeeManager(employeeId: string, managerId: string | null): Promise<void> {
  const { error } = await supabase.from('employees').update({ manager_id: managerId }).eq('id', employeeId);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'employee', entity_id: employeeId, action: 'update', summary: 'Zmieniono przełożonego' });
}

// ============ Departments CRUD ============
export type DepartmentInput = {
  name: string;
  code: string | null;
  parent_id: string | null;
  manager_id: string | null;
  icon: string | null;
  level: number;
  description: string | null;
};

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  const { data, error } = await supabase.from('departments').insert(input).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'department', entity_id: data.id, action: 'create', summary: `Dodano dział: ${data.name}` });
  return data as Department;
}

export async function updateDepartment(id: string, input: Partial<DepartmentInput>): Promise<Department> {
  const { data, error } = await supabase.from('departments').update(input).eq('id', id).select().single();
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'department', entity_id: id, action: 'update', summary: `Zaktualizowano dział: ${data.name}`, changes: input });
  return data as Department;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw new Error(errMessage(error));
  await logChange({ entity_type: 'department', entity_id: id, action: 'delete', summary: 'Usunięto dział' });
}
