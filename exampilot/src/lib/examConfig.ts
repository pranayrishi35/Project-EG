// src/lib/examConfig.ts

export type ExamTarget = "AFCAT" | "NDA_MATH" | "NDA_GAT" | "CDS";

export interface ExamConfig {
  total_questions: number;
  duration_seconds: number;
  marks_per_correct: number;
  negative_marking: number;
  subject_breakdown: Record<string, number>; // Subject → question count
}

export const EXAM_CONFIGS: Partial<Record<ExamTarget, ExamConfig>> = {
  AFCAT: {
    total_questions: 100,
    duration_seconds: 7200,
    marks_per_correct: 3,
    negative_marking: -1,
    subject_breakdown: {
      "General Awareness": 25,
      "Verbal Ability in English": 25,
      "Numerical Ability": 25,
      "Reasoning and Military Aptitude": 25,
    },
  },
  CDS: {
    total_questions: 120,
    duration_seconds: 7200,
    marks_per_correct: 3,
    negative_marking: -1,
    subject_breakdown: {
      "English": 40,
      "General Knowledge": 40,
      "Elementary Mathematics": 40,
    },
  },
};
