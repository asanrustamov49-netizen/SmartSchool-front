import api from "@/lib/axios";

// Роли из backend (users.role, check_user_role).
export type UserRole =
  | "SYSTEM_ADMIN"
  | "DIRECTOR"
  | "DEPUTY"
  | "CLASS_TEACHER"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

// POST /auth/login — схема LoginRequest
export type LoginRequest = {
  email: string;
  password: string;
};

// POST /auth/first-login-change — схема FirstLoginChange
export type FirstLoginChangeRequest = {
  current_password: string;
  new_password: string;
};

// Ответ /auth/login и /auth/first-login-change — схема TokenResponse
export type TokenResponse = {
  access_token: string;
  token_type: string;
  requires_password_change: boolean;
};

export type CurrentUserSchool = {
  id: number;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
};

export type StudentBadge = {
  badge_type: string;
  icon_name: string;
  subject_id: number | null;
  subject_name: string | null;
  awarded_at: string;
};

export type StudentSubjectStanding = {
  subject_id: number;
  subject_name: string | null;
  xp: number;
  class_rank: number | null;
  parallel_rank: number | null;
  school_rank: number | null;
};

export type StudentStanding = {
  student_id: number;
  full_name: string;
  avatar_url?: string | null;
  class_id: number | null;
  class_name: string | null;
  grade_number?: number;
  total_xp: number;
  class_rank: number | null;
  parallel_rank: number | null;
  school_rank: number | null;
  subjects: StudentSubjectStanding[];
  badges: StudentBadge[];
};

export type ParentChild = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  class_id: number | null;
  class_name: string | null;
};

export type TeacherLedClass = {
  id: number;
  name: string | null;
  academic_year: string;
};

export type TeacherAssignmentSummary = {
  id: number;
  class_id: number;
  class_name: string | null;
  subject_id: number;
  subject_name: string;
  academic_year: string;
};

// GET /me. В openapi.json схема ответа не описана,
// поля взяты из backend: mysite/api/me.py (get_me).
export type CurrentUser = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  school_id: number;
  is_temp_password: boolean;
  // Присылать ли копии уведомлений на почту.
  email_notifications: boolean;
  school: CurrentUserSchool | null;
  student?: StudentStanding;
  children?: ParentChild[];
  classes_led?: TeacherLedClass[];
  is_class_teacher?: boolean;
  assignments?: TeacherAssignmentSummary[];
};

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>("/auth/login", data);
  return response.data;
}

export async function changeFirstLoginPassword(
  data: FirstLoginChangeRequest,
): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>(
    "/auth/first-login-change",
    data,
  );
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>("/me");
  return response.data;
}

// POST /auth/forgot-password: ответ одинаковый, есть такая почта или нет.
export async function requestPasswordReset(email: string) {
  await api.post("/auth/forgot-password", { email });
}

// POST /auth/reset-password: token приходит в ссылке из письма (действует 30 минут, один раз).
export async function resetPassword(data: { token: string; new_password: string }) {
  await api.post("/auth/reset-password", data);
}
