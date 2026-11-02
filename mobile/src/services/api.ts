import { Activity, Comment, Course, Dashboard, Progress, ProgressStatus, Report, Topic } from '../types/course';
import { AddParentResult, Child, ParentInput, Student, StudentDetail, StudentInput } from '../types/student';
import { LoginResponse, User } from '../types/user';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5069';

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

// Oturum yönetimi (auth.tsx) token'ı ve oturum düştüğünde çağrılacak fonksiyonu buradan ayarlar.
export function setAuthToken(value: string | null) {
  token = value;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  }

  if (!res.ok) {
    // Giriş isteği dışındaki 401'ler oturumun süresinin dolduğu anlamına gelir.
    if (res.status === 401 && token) onUnauthorized?.();
    if (res.status === 429) throw new Error('Çok fazla deneme yapıldı. Lütfen bir dakika sonra tekrar deneyin.');

    const body = await res.json().catch(() => null);
    const messages = body?.errors ? Object.values<string[]>(body.errors).flat() : [];
    const fallback = res.status === 404 ? 'Kayıt bulunamadı.' : res.status === 403 ? 'Bu işlem için yetkiniz yok.' : null;
    throw new Error(messages.join('\n') || fallback || body?.title || `İstek başarısız (${res.status})`);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Bilinmeyen hata');

// Oturum
export const login = (email: string, password: string) =>
  send<LoginResponse>('POST', '/api/auth/login', { email, password });
export const register = (fullName: string, email: string, password: string) =>
  send<LoginResponse>('POST', '/api/auth/register', { fullName, email, password });
export const getMe = () => request<User>('/api/auth/me');
// Yeni token döner (zorunlu değiştirme işareti kalkmış olarak).
export const changePassword = (currentPassword: string, newPassword: string) =>
  send<LoginResponse>('PUT', '/api/auth/password', { currentPassword, newPassword });

// Öğretmen: öğrenciler
export const getStudents = () => request<Student[]>('/api/students');
export const getStudent = (id: number) => request<StudentDetail>(`/api/students/${id}`);
export const createStudent = (input: StudentInput) => send<Student>('POST', '/api/students', input);
export const updateStudent = (id: number, input: StudentInput) => send<void>('PUT', `/api/students/${id}`, input);
export const deleteStudent = (id: number) => send<void>('DELETE', `/api/students/${id}`);

// Öğretmen: veliler
export const addParent = (studentId: number, input: ParentInput) =>
  send<AddParentResult>('POST', `/api/students/${studentId}/parents`, input);
export const removeParent = (studentId: number, parentId: number) =>
  send<void>('DELETE', `/api/students/${studentId}/parents/${parentId}`);
export const resetParentPassword = (studentId: number, parentId: number, password: string) =>
  send<void>('PUT', `/api/students/${studentId}/parents/${parentId}/password`, { password });

// Öğretmen: dersler ve konular
export const getCourses = () => request<Course[]>('/api/courses');
export const getCourse = (id: number) => request<Course>(`/api/courses/${id}`);
export const createCourse = (name: string) => send<Course>('POST', '/api/courses', { name });
export const updateCourse = (id: number, name: string) => send<void>('PUT', `/api/courses/${id}`, { name });
export const deleteCourse = (id: number) => send<void>('DELETE', `/api/courses/${id}`);
export const createTopic = (courseId: number, name: string, order: number) =>
  send<Topic>('POST', `/api/courses/${courseId}/topics`, { name, order });
export const updateTopic = (id: number, name: string, order: number) =>
  send<Topic>('PUT', `/api/topics/${id}`, { name, order });
export const deleteTopic = (id: number) => send<void>('DELETE', `/api/topics/${id}`);

// İlerleme (öğretmen ve veli okuyabilir, yalnızca öğretmen günceller)
export const getProgress = (studentId: number) => request<Progress[]>(`/api/students/${studentId}/progress`);
export const updateProgress = (studentId: number, topicId: number, status: ProgressStatus, date: Date | null) =>
  send<Progress>('PUT', `/api/students/${studentId}/progress/${topicId}`, { status, date: date?.toISOString() ?? null });

// Konu yorumları (öğretmen ve veli)
export const getComments = (studentId: number, topicId: number) =>
  request<Comment[]>(`/api/students/${studentId}/topics/${topicId}/comments`);
export const addComment = (studentId: number, topicId: number, text: string) =>
  send<Comment>('POST', `/api/students/${studentId}/topics/${topicId}/comments`, { text });
export const deleteComment = (id: number) => send<void>('DELETE', `/api/comments/${id}`);

export const getDashboard = () => request<Dashboard>('/api/dashboard');
export const getReport = () => request<Report>('/api/reports/summary');

// Veli
export const getChildren = () => request<Child[]>('/api/my/children');
export const getActivity = () => request<Activity[]>('/api/my/activity');
