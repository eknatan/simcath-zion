/**
 * User Management Types
 *
 * עקרונות SOLID:
 * - Interface Segregation: ממשקים ספציפיים לכל מקרה שימוש
 * - Single Responsibility: כל type עם מטרה אחת ברורה
 */

export type UserRole = 'secretary' | 'manager';
export type UserStatus = 'active' | 'suspended';
export type UserAction = 'create' | 'update' | 'delete' | 'suspend' | 'activate' | 'invite';

/**
 * Profile - פרופיל משתמש מלא
 * מייצג את כל המידע על משתמש במערכת
 */
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * CreateUserInput - נתונים ליצירת משתמש חדש
 * לא כולל סיסמה - משתמש בהזמנה באימייל
 */
export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  notes?: string;
}

/**
 * UpdateUserInput - נתונים לעדכון משתמש קיים
 * כל השדות אופציונליים (Partial update)
 */
export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string | null;
  notes?: string | null;
}

/**
 * UserAuditLog - רישום פעילות במערכת
 * לצורכי ביקורת ומעקב אחר שינויים
 */
export interface UserAuditLog {
  id: string;
  performed_by: string | null;
  action: UserAction;
  target_user_id: string | null;
  target_user_email: string;
  changes: Record<string, { old: any; new: any }> | null;
  created_at: string;
}

/**
 * UsersResponse - תגובה מה-API לרשימת משתמשים
 * כולל pagination
 */
export interface UsersResponse {
  users: Profile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * UserFilters - פילטרים לחיפוש משתמשים
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}
