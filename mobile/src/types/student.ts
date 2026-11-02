export type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  gradeLevel: number;
  createdAt: string;
};

export type StudentInput = Omit<Student, 'id' | 'createdAt'>;
