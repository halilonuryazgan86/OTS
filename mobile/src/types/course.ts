export type Topic = {
  id: number;
  courseId: number;
  name: string;
  order: number;
};

export type Course = {
  id: number;
  name: string;
  topics: Topic[];
};

export type ProgressStatus = 'NotStarted' | 'InProgress' | 'Completed';

export type Progress = {
  topicId: number;
  topicName: string;
  courseId: number;
  courseName: string;
  status: ProgressStatus;
  // Öğretmenin girdiği işlem tarihi-saati (Başlamadı ise boş).
  statusDate: string | null;
  updatedAt: string | null;
  commentCount: number;
  lastComment: string | null;
};

export type Comment = {
  id: number;
  text: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorRole: 'Teacher' | 'Parent';
};

// Akıştaki olay: durum değişikliği ya da yorum.
export type Activity = {
  kind: 'Status' | 'Comment';
  studentId: number;
  studentName: string;
  topicId: number;
  topicName: string;
  courseName: string;
  status: ProgressStatus | null;
  text: string | null;
  authorName: string | null;
  date: string;
};

export type Report = {
  studentCount: number;
  topicCount: number;
  totals: { completed: number; inProgress: number; notStarted: number };
  courses: { id: number; name: string; topicCount: number; completed: number; inProgress: number; possible: number }[];
  students: { id: number; name: string; gradeLevel: number; completed: number; inProgress: number; total: number }[];
  grades: { gradeLevel: number; studentCount: number; completed: number; possible: number }[];
  weeks: { weekStart: string; completed: number }[];
};

export type Dashboard = {
  studentCount: number;
  courseCount: number;
  topicCount: number;
  completedCount: number;
  recentActivity: Activity[];
};
