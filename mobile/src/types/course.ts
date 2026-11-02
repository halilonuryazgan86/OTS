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
  completedAt: string | null;
  note: string | null;
};
