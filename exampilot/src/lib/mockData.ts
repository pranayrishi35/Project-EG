export const MOCK_STUDY_PLAN_DATA = {
  exam_name: "Mock Exam (Trial)",
  exam_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  generated_plan: {
    weeks: [
      {
        week: 1,
        days: [
          { day: 1, topics: ["Introduction to Trial Mode", "Guest Shield Basics"] },
          { day: 2, topics: ["Advanced Mock Data", "Performance Tracking"] },
        ]
      }
    ],
    completed_topics: ["Introduction to Trial Mode"]
  }
};

export const MOCK_HISTORY_DATA = [
  {
    id: "trial-mock-1",
    exam_target: "AFCAT",
    test_number: 1,
    status: "completed",
    score: 240,
    created_at: new Date().toISOString()
  }
];

export const MOCK_PERFORMANCE_DASHBOARD_DATA = {
  average_score: 240,
  tests_taken: 1,
  recent_scores: [240],
  weak_subjects: ["General Awareness", "Numerical Ability"]
};

export const MOCK_AI_COACHING_INSIGHTS = {
  insights: [
    "You have a strong grasp of reasoning concepts, but numerical ability needs work.",
    "Focus on time management in the general awareness section."
  ]
};
