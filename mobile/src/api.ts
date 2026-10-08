const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5069';

export type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  gradeLevel: number;
  createdAt: string;
};

export type StudentInput = Omit<Student, 'id' | 'createdAt'>;

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
