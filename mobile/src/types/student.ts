export type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  gradeLevel: number;
  createdAt: string;
  completedTopics: number;
  totalTopics: number;
};

export type Parent = {
  id: number;
  fullName: string;
  email: string;
};

export type StudentDetail = Student & {
  parents: Parent[];
};

export type StudentInput = {
  firstName: string;
  lastName: string;
  email: string | null;
  gradeLevel: number;
};

// LinkedExisting: e-posta zaten bir veliye aitti (ör. kardeşin velisi) ve o hesap bağlandı.
export type AddParentResult = Parent & { linkedExisting: boolean };

export type ParentInput = {
  fullName: string;
  email: string;
  password: string | null;
};

// Veli ekranındaki çocuk kartı.
export type Child = {
  id: number;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  teacherName: string | null;
  completedTopics: number;
  totalTopics: number;
};
