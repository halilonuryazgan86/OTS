import { Course, Progress, ProgressStatus, Topic } from '../types/course';
import { Student, StudentInput } from '../types/student';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5069';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const messages = body?.errors ? Object.values<string[]>(body.errors).flat() : [];
    throw new Error(messages.join('\n') || `İstek başarısız (${res.status})`);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}

export const getStudents = () => request<Student[]>('/api/students');

export const createStudent = (input: StudentInput) =>
  request<Student>('/api/students', { method: 'POST', body: JSON.stringify(input) });

export const deleteStudent = (id: number) =>
  request<void>(`/api/students/${id}`, { method: 'DELETE' });

export const getCourses = () => request<Course[]>('/api/courses');

export const createCourse = (name: string) =>
  request<Course>('/api/courses', { method: 'POST', body: JSON.stringify({ name }) });

export const deleteCourse = (id: number) =>
  request<void>(`/api/courses/${id}`, { method: 'DELETE' });

export const createTopic = (courseId: number, name: string, order: number) =>
  request<Topic>(`/api/courses/${courseId}/topics`, { method: 'POST', body: JSON.stringify({ name, order }) });

export const deleteTopic = (id: number) =>
  request<void>(`/api/topics/${id}`, { method: 'DELETE' });

export const getProgress = (studentId: number) =>
  request<Progress[]>(`/api/students/${studentId}/progress`);

export const updateProgress = (studentId: number, topicId: number, status: ProgressStatus, note: string | null) =>
  request<Progress>(`/api/students/${studentId}/progress/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Bilinmeyen hata');
