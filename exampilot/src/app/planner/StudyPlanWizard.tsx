"use client";

import React, { useState } from 'react';
import PrimaryButton from '@/components/PrimaryButton';

/**
 * StudyPlanWizard - embedded multi‑step flow for creating a study plan.
 * Steps (simplified for now):
 *   1. Value proposition header
 *   2. Syllabus upload (clickable area, 44×44 px min)
 *   3. Optional exam date picker & study intensity
 *   4. CTA button "Build My Custom Plan"
 */
export default function StudyPlanWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [examDate, setExamDate] = useState('');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    // Placeholder: upload file & create plan via API
    console.log('Submitting', { file, examDate, intensity });
    // TODO: integrate with backend endpoint
    setSubmitting(false);
  };

  return (
    <section className="flex flex-col gap-6 max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <header className="text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Get a Personalized Study Roadmap</h2>
        <p className="text-sm text-slate-700">
          Upload your syllabus and let ExamPilot generate a custom 8‑week plan in seconds.
        </p>
      </header>

      {/* Step 1 – Syllabus Upload */}
      <div className="flex flex-col items-center">
        <label
          htmlFor="syllabus-upload"
          className="flex items-center justify-center w-full min-h-[44px] border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
        >
          {file ? (
            <span className="text-slate-700">{file.name}</span>
          ) : (
            <span className="text-slate-500">Tap to select your syllabus (PDF, DOCX…)</span>
          )}
          <input
            id="syllabus-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Step 2 – Exam Date */}
      <div className="flex flex-col">
        <label htmlFor="exam-date" className="text-sm font-medium text-slate-700 mb-1">
          Exam Date (optional)
        </label>
        <input
          id="exam-date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="w-full border border-slate-300 rounded-md py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Step 3 – Study Intensity */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700 mb-1">Study Intensity</span>
        <div className="flex gap-2">
          {(['light', 'moderate', 'intense'] as const).map((level) => (
            <label key={level} className="inline-flex items-center">
              <input
                type="radio"
                name="intensity"
                value={level}
                checked={intensity === level}
                onChange={() => setIntensity(level)}
                className="mr-2 text-indigo-600 border-slate-300"
              />
              <span className="capitalize text-slate-700">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CTA */}
      <PrimaryButton
        onClick={handleSubmit}
        disabled={!file || submitting}
        className="w-full"
      >
        {submitting ? 'Building...' : 'Build My Custom Plan'}
      </PrimaryButton>
    </section>
  );
}
