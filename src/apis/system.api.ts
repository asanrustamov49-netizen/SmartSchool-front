import api from "@/lib/axios";

// API платформы для SYSTEM_ADMIN (backend: mysite/api/system.py).
// Схемы ответов в openapi.json пустые, поля взяты из serialize_school и admin_row.

export type PlatformStats = {
  schools: number;
  active_schools: number;
  directors: number;
  deputies: number;
  teachers: number;
  students: number;
  parents: number;
};

export type SchoolAdminRole = "DIRECTOR" | "DEPUTY";

// Руководитель школы (директор или завуч). temporary_password приходит,
// пока человек не сменил выданный пароль.
export type SchoolAdmin = {
  id: number;
  inn: string;
  full_name: string;
  phone: string | null;
  role: SchoolAdminRole;
  is_active: boolean;
  is_temp_password: boolean;
  temporary_password: string | null;
  created_at: string;
};

export type SystemSchool = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  banner_url: string | null;
  director_name: string | null;
  is_active: boolean;
  created_at: string;
  stats: { students: number; teachers: number; classes: number };
  admins?: SchoolAdmin[];
};

// Поля школы из схем SchoolCreate / SchoolUpdate.
export type SystemSchoolFields = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

// Схема SchoolAdminCreate.
export type SchoolAdminFields = {
  inn: string;
  full_name: string;
  phone: string | null;
};

export type SystemSchoolCreated = {
  message: string;
  school: SystemSchool;
  director: { id: number; inn: string; full_name: string; temporary_password: string };
};

export type AdminPasswordReset = {
  user_id: number;
  inn: string;
  full_name: string;
  temporary_password: string;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const response = await api.get<PlatformStats>("/system/stats");
  return response.data;
}

export async function getSystemSchools(): Promise<SystemSchool[]> {
  const response = await api.get<SystemSchool[]>("/system/schools");
  return response.data;
}

export async function getSystemSchool(schoolId: number): Promise<SystemSchool> {
  const response = await api.get<SystemSchool>(`/system/schools/${schoolId}`);
  return response.data;
}

// Школа создаётся вместе с директором; его временный пароль backend возвращает один раз.
export async function createSystemSchool(
  data: SystemSchoolFields & { director: SchoolAdminFields },
): Promise<SystemSchoolCreated> {
  const response = await api.post<SystemSchoolCreated>("/system/schools", data);
  return response.data;
}

export async function updateSystemSchool(schoolId: number, data: SystemSchoolFields) {
  const response = await api.put<SystemSchool>(`/system/schools/${schoolId}`, data);
  return response.data;
}

// Закрытая школа сохраняет данные, но её пользователи не могут войти.
export async function setSchoolActive(schoolId: number, active: boolean) {
  await api.post(`/system/schools/${schoolId}/${active ? "activate" : "deactivate"}`);
}

export async function addSchoolAdmin(
  schoolId: number,
  data: SchoolAdminFields & { role: SchoolAdminRole },
): Promise<SchoolAdmin> {
  const response = await api.post<SchoolAdmin>(`/system/schools/${schoolId}/admins`, data);
  return response.data;
}

export async function resetSchoolAdminPassword(userId: number): Promise<AdminPasswordReset> {
  const response = await api.post<AdminPasswordReset>(`/system/users/${userId}/reset-password`);
  return response.data;
}

export async function setSchoolAdminActive(userId: number, active: boolean) {
  await api.post(`/system/users/${userId}/${active ? "activate" : "deactivate"}`);
}

// Правило школы: один директор и не больше пяти завучей.
// Считаются только активные аккаунты: отключённого можно заменить новым.
// Backend это правило пока не проверяет, поэтому интерфейс не даёт его нарушить.
export const MAX_DIRECTORS = 1;
export const MAX_DEPUTIES = 5;

export type AdminLimits = {
  directors: number;
  deputies: number;
  canAddDirector: boolean;
  canAddDeputy: boolean;
};

export function getAdminLimits(admins: SchoolAdmin[]): AdminLimits {
  const active = admins.filter((person) => person.is_active);
  const directors = active.filter((person) => person.role === "DIRECTOR").length;
  const deputies = active.filter((person) => person.role === "DEPUTY").length;
  return {
    directors,
    deputies,
    canAddDirector: directors < MAX_DIRECTORS,
    canAddDeputy: deputies < MAX_DEPUTIES,
  };
}

// Можно ли снова включить отключённого руководителя, не превысив лимит его роли.
export function canActivateAdmin(person: SchoolAdmin, limits: AdminLimits) {
  return person.role === "DIRECTOR" ? limits.canAddDirector : limits.canAddDeputy;
}
