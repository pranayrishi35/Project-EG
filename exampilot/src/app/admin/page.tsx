/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { getAppConfig, updateAppConfig, getSystemInsights, AppConfig, SystemInsights } from "@/app/actions/adminConfig";
import { adminSeedQuestions, generateFullMockTest } from "@/app/actions/adminSeedQuestions";
import { generateNewsMCQs } from "@/app/actions/generateNewsMCQs";
import { triggerNewsFetch } from "@/app/actions/triggerNewsFetch";
import { getMockAttempts, deleteMockAttempt } from "@/app/actions/mockAttemptsAdmin";
import { fetchRecentUsers, fetchQuestions, deleteQuestion, addManualQuestion } from "@/app/actions/adminManagement";

const subjectsByExam: Record<string, string[]> = {
  AFCAT: ["English", "General Awareness", "Numerical Ability", "Reasoning"],
  NDA_MATH: ["Algebra", "Calculus", "Trigonometry and Geometry", "Statistics and Probability"],
  NDA_GAT: ["English", "General Science", "General Studies"],
  CDS: ["English", "General Knowledge", "Elementary Mathematics"]
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"Config" | "Questions" | "Users">("Config");
  
  const [config, setConfig] = useState<AppConfig[]>([]);
  const [insights, setInsights] = useState<SystemInsights | null>(null);
  
  // Seed State (Targeted)
  const [seedExam, setSeedExam] = useState("AFCAT");
  const [seedSubject, setSeedSubject] = useState("English");
  const [sourcePool, setSourcePool] = useState("booklet");
  const [isPyq, setIsPyq] = useState(false);

  useEffect(() => {
    if (subjectsByExam[seedExam]) {
      setSeedSubject(subjectsByExam[seedExam][0]);
    }
  }, [seedExam]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);

  // Seed State (Full Mock)
  const [fullMockExam, setFullMockExam] = useState("AFCAT");
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [mockProgress, setMockProgress] = useState(0);

  // News Pipeline State
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [isGeneratingNewsMCQs, setIsGeneratingNewsMCQs] = useState(false);

  // Status State
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  // Mock Attempts
  const [mockAttempts, setMockAttempts] = useState<any[]>([]);

  // CMS State (Users)
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // CMS State (Questions)
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionExam, setQuestionExam] = useState("AFCAT");
  const [questionSubject, setQuestionSubject] = useState("English");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    exam_target: "AFCAT",
    subject: "English",
    question: "",
    option1: "", option2: "", option3: "", option4: "",
    correct_index: 0,
    is_pyq: false,
    pyq_year: ""
  });
  
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [configRes, insightsRes, mockRes] = await Promise.all([getAppConfig(), getSystemInsights(), getMockAttempts()]);
      
      if (configRes.success && configRes.data) setConfig(configRes.data);
      if (insightsRes.success && insightsRes.data) setInsights(insightsRes.data);
      if (mockRes.success && mockRes.data) setMockAttempts(mockRes.data);
      
      setLoading(false);
    }
    loadData();
  }, []);

  // Fetch users when Users tab is active
  useEffect(() => {
    if (activeTab === "Users" && users.length === 0) {
      loadUsers();
    }
  }, [activeTab]);

  // Fetch questions when Questions tab is active or filters change
  useEffect(() => {
    if (activeTab === "Questions") {
      loadQuestions();
    }
  }, [activeTab, questionExam, questionSubject]);

  useEffect(() => {
    if (subjectsByExam[questionExam] && !subjectsByExam[questionExam].includes(questionSubject)) {
      setQuestionSubject(subjectsByExam[questionExam][0]);
    }
  }, [questionExam]);

  useEffect(() => {
    if (subjectsByExam[newQuestion.exam_target] && !subjectsByExam[newQuestion.exam_target].includes(newQuestion.subject)) {
      setNewQuestion(prev => ({ ...prev, subject: subjectsByExam[prev.exam_target][0] }));
    }
  }, [newQuestion.exam_target]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await fetchRecentUsers();
    if (res.success && res.data) {
      setUsers(res.data);
    } else {
      showToast(`Failed to load users: ${res.error}`, "error");
    }
    setLoadingUsers(false);
  };

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    const res = await fetchQuestions(questionExam, questionSubject);
    if (res.success && res.data) {
      setQuestions(res.data);
    } else {
      showToast(`Failed to load questions: ${res.error}`, "error");
    }
    setLoadingQuestions(false);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleUpdateConfig = async (key: string, newValue: string) => {
    const res = await updateAppConfig(key, newValue);
    if (res.success) {
      setConfig(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
      showToast(`Successfully updated ${key}`, "success");
    } else {
      showToast(`Failed to update ${key}: ${res.error}`, "error");
    }
  };

  const simulateProgress = (setProgress: (val: number | ((prev: number) => number)) => void, durationMs: number) => {
    setProgress(0);
    const interval = 100;
    const steps = durationMs / interval;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const percent = Math.min(95, Math.floor((currentStep / steps) * 100));
      setProgress(percent);
    }, interval);
    
    return timer;
  };

  const handleSeedQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSeeding(true);
    
    const timer = simulateProgress(setSeedProgress, 15000);
    const res = await adminSeedQuestions(seedExam, isPyq, sourcePool, seedSubject);
    
    clearInterval(timer);
    setSeedProgress(100); 
    
    setTimeout(() => {
      setIsSeeding(false);
      setSeedProgress(0);
      if (res.success) {
        showToast(`Successfully seeded ${res.count} questions for ${seedExam}`, "success");
        getSystemInsights().then(insightsRes => {
          if (insightsRes.success && insightsRes.data) setInsights(insightsRes.data);
        });
      } else {
        showToast(`Seeding failed: ${res.error}`, "error");
      }
    }, 500);
  };

  const handleGenerateFullMock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingMock(true);
    
    const timer = simulateProgress(setMockProgress, 60000);
    const res = await generateFullMockTest(fullMockExam);
    
    clearInterval(timer);
    setMockProgress(100);
    
    setTimeout(() => {
      setIsGeneratingMock(false);
      setMockProgress(0);
      if (res.success) {
        showToast(`Mass generated ${res.count} questions for ${fullMockExam} Full Mock!`, "success");
        getSystemInsights().then(insightsRes => {
          if (insightsRes.success && insightsRes.data) setInsights(insightsRes.data);
        });
      } else {
        showToast(`Full Mock generation failed: ${res.error}`, "error");
      }
    }, 500);
  };

  const handleDeleteMock = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mock attempt?")) return;
    const res = await deleteMockAttempt(id);
    if (res.success) {
      setMockAttempts(prev => prev.filter(m => m.id !== id));
      showToast("Mock attempt deleted.", "success");
    } else {
      showToast(`Delete failed: ${res.error}`, "error");
    }
  };

  const handleFetchNews = async () => {
    setIsFetchingNews(true);
    try {
      const data = await triggerNewsFetch();
      if (data.success) {
        showToast(`Successfully fetched & summarized ${data.count} articles!`, "success");
      } else {
        showToast(`Fetch failed: ${data.error}`, "error");
      }
    } catch (e: any) {
      showToast(`Fetch error: ${e.message}`, "error");
    } finally {
      setIsFetchingNews(false);
    }
  };

  const handleGenerateNewsMCQs = async () => {
    setIsGeneratingNewsMCQs(true);
    try {
      const res = await generateNewsMCQs();
      if (res.success) {
        showToast(`Successfully extracted ${res.count} MCQs from recent news!`, "success");
        getSystemInsights().then(insightsRes => {
          if (insightsRes.success && insightsRes.data) setInsights(insightsRes.data);
        });
      } else {
        showToast(`MCQ generation failed: ${res.error}`, "error");
      }
    } catch (e: any) {
      showToast(`MCQ error: ${e.message}`, "error");
    } finally {
      setIsGeneratingNewsMCQs(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question || !newQuestion.option1 || !newQuestion.option2 || !newQuestion.option3 || !newQuestion.option4) {
      showToast("Please fill all required fields", "error");
      return;
    }

    const payload = {
      exam_target: newQuestion.exam_target,
      subject: newQuestion.subject,
      question: newQuestion.question,
      options: [newQuestion.option1, newQuestion.option2, newQuestion.option3, newQuestion.option4],
      correct_index: newQuestion.correct_index,
      is_pyq: newQuestion.is_pyq,
      pyq_year: newQuestion.pyq_year
    };

    const res = await addManualQuestion(payload);
    if (res.success) {
      showToast("Question added successfully!", "success");
      setIsAddModalOpen(false);
      loadQuestions();
    } else {
      showToast(`Failed to add question: ${res.error}`, "error");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    const res = await deleteQuestion(id);
    if (res.success) {
      showToast("Question deleted successfully!", "success");
      setQuestions(prev => prev.filter(q => q.id !== id));
    } else {
      showToast(`Failed to delete question: ${res.error}`, "error");
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 overflow-y-auto pb-24 relative overflow-visible">
      
      {/* Toast Notification with z-[100] */}
      {toast && (
        <div className={`fixed top-24 md:top-4 right-4 px-6 py-4 rounded-xl font-bold shadow-2xl z-[100] animate-fade-in flex items-center gap-3 border ${
          toast.type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-rose-950 border-rose-500 text-rose-400"
        }`}>
          <span className="text-xl">{toast.type === "success" ? "✅" : "⚠️"}</span>
          {toast.message}
        </div>
      )}

      {/* Admin Header & Tabs */}
      <div className="sticky top-0 z-[60] bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 md:p-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span aria-hidden="true">🛠️</span> Command Center
          </h1>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {(["Config", "Questions", "Users"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                  activeTab === tab 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* TAB 1: CONFIGURATION */}
        {activeTab === "Config" && (
          <div className="space-y-12">
            {/* Section 1: System Insights */}
            <section>
              <h2 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">📊</span> 
                System Insights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                {loading ? (
                  <>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800/50 p-8 rounded-3xl animate-pulse">
                        <div className="h-12 w-24 bg-slate-800 rounded-lg mb-4"></div>
                        <div className="h-4 w-32 bg-slate-800 rounded"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-sm hover:border-slate-700 hover:shadow-indigo-500/5 transition-all">
                      <div className="text-5xl font-black text-indigo-400 mb-2 tabular-nums">{insights?.profiles || 0}</div>
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">Registered Profiles</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-sm hover:border-slate-700 hover:shadow-amber-500/5 transition-all">
                      <div className="text-5xl font-black text-amber-400 mb-2 tabular-nums">{insights?.studyPlans || 0}</div>
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">Generated Plans</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-sm hover:border-slate-700 hover:shadow-emerald-500/5 transition-all">
                      <div className="text-5xl font-black text-emerald-400 mb-2 tabular-nums">{insights?.questions || 0}</div>
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">Question Bank Volume</div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Section 2: AI Engine Routing */}
            <section>
              <h2 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">⚙️</span> 
                AI Engine Routing
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                  <div className="p-8 space-y-6">
                    {[1, 2].map(i => (
                      <div key={i} className="animate-pulse flex flex-col md:flex-row gap-4 justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="h-5 w-48 bg-slate-800 rounded"></div>
                          <div className="h-4 w-full max-w-xl bg-slate-800 rounded"></div>
                        </div>
                        <div className="h-12 w-full md:w-80 bg-slate-800 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : config.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 font-medium">No configurations found. Add them directly in Supabase to start overriding local keys.</div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {config.map((item) => (
                      <div key={item.key} className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:items-center hover:bg-slate-800/30 transition-colors">
                        <div className="flex-1">
                          <h3 className="text-base font-black text-indigo-300 font-mono mb-1.5">{item.key}</h3>
                          {item.description && <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{item.description}</p>}
                        </div>
                        <div className="flex w-full lg:w-96 items-center shrink-0">
                          <input 
                            type="text" 
                            defaultValue={item.value} 
                            onBlur={(e) => {
                              if (e.target.value !== item.value) {
                                handleUpdateConfig(item.key, e.target.value);
                              }
                            }}
                            className="w-full min-w-0 bg-slate-950 border border-slate-700 text-slate-200 text-sm px-5 py-3.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                            placeholder="Enter new model string..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Section 3: Question Bank Seeding */}
            <section>
              <h2 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">🧠</span> 
                Question Bank Operations
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Card 1: Targeted Seed */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-6">Targeted Seed (30 Qs)</h3>
                  <form onSubmit={handleSeedQuestions} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Exam</label>
                        <div className="relative">
                          <select 
                            value={seedExam} 
                            onChange={e => setSeedExam(e.target.value)}
                            className="w-full min-w-0 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-3.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
                          >
                            <option value="AFCAT">AFCAT</option>
                            <option value="NDA_MATH">NDA Math</option>
                            <option value="NDA_GAT">NDA GAT</option>
                            <option value="CDS">CDS</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                        <div className="relative">
                          <select 
                            value={seedSubject} 
                            onChange={e => setSeedSubject(e.target.value)}
                            className="w-full min-w-0 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-3.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
                          >
                            {subjectsByExam[seedExam]?.map(subj => (
                              <option key={subj} value={subj}>{subj}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Destination Pool</label>
                        <div className="relative">
                          <select 
                            value={sourcePool} 
                            onChange={e => setSourcePool(e.target.value)}
                            className="w-full min-w-0 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-3.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
                          >
                            <option value="booklet">Static Booklet</option>
                            <option value="mock">Dynamic Mock</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <input 
                        type="checkbox" 
                        id="isPyq" 
                        checked={isPyq}
                        onChange={e => setIsPyq(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900"
                      />
                      <label htmlFor="isPyq" className="text-sm font-semibold text-slate-300 cursor-pointer select-none">
                        Mark batch as Previous Year Questions (PYQs)
                      </label>
                    </div>

                    <div className="mt-2 relative">
                      <button 
                        type="submit" 
                        disabled={isSeeding || isGeneratingMock}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] relative overflow-hidden"
                      >
                        {isSeeding && (
                          <div 
                            className="absolute inset-y-0 left-0 bg-indigo-400/30 transition-all duration-200"
                            style={{ width: `${seedProgress}%` }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {isSeeding ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating ({seedProgress}%)
                            </>
                          ) : "Generate 30 Questions"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Card 2: Full Mock Generator */}
                <div className="bg-slate-900 border border-indigo-900/50 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(79,70,229,0.05)] relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600"></div>
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><span>🚀</span> Full Mock Generator</h3>
                  
                  <form onSubmit={handleGenerateFullMock} className="flex flex-col gap-5 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Exam Layout</label>
                      <div className="relative">
                        <select 
                          value={fullMockExam} 
                          onChange={e => setFullMockExam(e.target.value)}
                          className="w-full min-w-0 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-3.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
                        >
                          <option value="AFCAT">AFCAT (100 Qs)</option>
                          <option value="NDA_MATH">NDA Math (120 Qs)</option>
                          <option value="NDA_GAT">NDA GAT (150 Qs)</option>
                          <option value="CDS">CDS (120 Qs)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end mt-4">
                      <button 
                        type="submit" 
                        disabled={isGeneratingMock || isSeeding}
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-white font-bold text-base py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 active:scale-[0.99] min-h-[80px] relative overflow-hidden group"
                      >
                        {isGeneratingMock && (
                          <div 
                            className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-200"
                            style={{ width: `${mockProgress}%` }}
                          />
                        )}
                        <span className="relative z-10 flex flex-col items-center gap-1">
                          {isGeneratingMock ? (
                            <>
                              <div className="flex items-center gap-2 text-indigo-300">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Building Mock ({mockProgress}%)</span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-400">Please wait up to 60 seconds...</span>
                            </>
                          ) : (
                            <>
                              <span className="group-hover:text-indigo-300 transition-colors">Generate Full Mock Test</span>
                              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Executes Sequentially</span>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* Section 4: News Pipeline */}
            <section>
              <h2 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">📰</span> 
                News Pipeline Operations
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col h-full">
                  <h3 className="text-lg font-bold text-white mb-2">Manual Cron Trigger</h3>
                  <p className="text-sm text-slate-400 mb-6">Hits the /api/cron/fetch-news route to pull fresh GNews and summarize via Gemini.</p>
                  <div className="flex-1 flex flex-col justify-end">
                    <button 
                      onClick={handleFetchNews}
                      disabled={isFetchingNews}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-base py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      {isFetchingNews ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Fetching & Summarizing...
                        </>
                      ) : "Force News Fetch"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-emerald-900/50 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><span>🎯</span> Extract MCQs from News</h3>
                  <p className="text-sm text-slate-400 mb-6">Reviews news_cache entries from the last 24 hours and uses Gemini to generate highly relevant MCQs.</p>
                  <div className="flex-1 flex flex-col justify-end">
                    <button 
                      onClick={handleGenerateNewsMCQs}
                      disabled={isGeneratingNewsMCQs}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-white font-bold text-base py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.99] group"
                    >
                      {isGeneratingNewsMCQs ? (
                        <div className="flex items-center gap-2 text-emerald-300">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Extracting Questions...</span>
                        </div>
                      ) : (
                        <span className="group-hover:text-emerald-300 transition-colors">Generate News MCQs</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Manage Mock Tests */}
            <section>
              <h2 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">🗑️</span> 
                Manage Mock Tests
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                {mockAttempts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium">
                    No mock tests found in the database.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-800/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">User ID</th>
                          <th className="px-6 py-4">Exam</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Created At</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {mockAttempts.map(attempt => (
                          <tr key={attempt.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-slate-500" title={attempt.id}>
                              {attempt.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-400" title={attempt.user_id}>
                              {attempt.user_id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 font-bold text-white">
                              {attempt.exam_target}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                attempt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {attempt.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {new Date(attempt.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteMock(attempt.id)}
                                className="bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 border border-rose-900/50 hover:border-rose-500 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: QUESTION MANAGER */}
        {activeTab === "Questions" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Exam Target</label>
                  <select 
                    value={questionExam} 
                    onChange={e => setQuestionExam(e.target.value)}
                    className="w-full md:w-48 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="AFCAT">AFCAT</option>
                    <option value="NDA_MATH">NDA Math</option>
                    <option value="NDA_GAT">NDA GAT</option>
                    <option value="CDS">CDS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                  <select 
                    value={questionSubject} 
                    onChange={e => setQuestionSubject(e.target.value)}
                    className="w-full md:w-48 bg-slate-950 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    {subjectsByExam[questionExam]?.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 mt-4 md:mt-0 whitespace-nowrap"
              >
                <span>➕</span> Add New Question
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {loadingQuestions ? (
                <div className="p-12 flex justify-center items-center">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  No questions found for {questionExam} - {questionSubject}.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 w-12"></th>
                        <th className="px-6 py-4">Question</th>
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4 whitespace-nowrap">Created At</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {questions.map((q) => (
                        <React.Fragment key={q.id}>
                          <tr className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                                className="text-slate-400 hover:text-white"
                              >
                                {expandedQuestionId === q.id ? "▼" : "▶"}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-200">
                              <div className="line-clamp-2">{q.question}</div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400">
                              {q.is_pyq ? <span className="text-amber-400">PYQ {q.pyq_year}</span> : <span className="text-indigo-400">Generated</span>}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                              {new Date(q.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 border border-rose-900/50 hover:border-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                          {expandedQuestionId === q.id && (
                            <tr className="bg-slate-950/50">
                              <td colSpan={5} className="px-12 py-6 border-b border-slate-800">
                                <div className="space-y-4">
                                  <p className="text-white font-medium">{q.question}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options.map((opt: string, idx: number) => (
                                      <div key={idx} className={`p-3 rounded-lg border text-sm ${idx === q.correct_index ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-200" : "bg-slate-900 border-slate-700 text-slate-400"}`}>
                                        <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER INTELLIGENCE */}
        {activeTab === "Users" && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
              <span className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">👥</span> 
              New Registrations & Intelligence
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {loadingUsers ? (
                <div className="p-12 flex justify-center items-center">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4 whitespace-nowrap">Join Date</th>
                        <th className="px-6 py-4 whitespace-nowrap">Last Sign In</th>
                        <th className="px-6 py-4 text-right">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                            {u.name}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {new Date(u.joinDate).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {u.lastSignIn ? new Date(u.lastSignIn).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="bg-amber-900/30 border border-amber-700/50 text-amber-400 px-3 py-1 rounded-full font-bold text-xs">
                              ⚡ {u.credits}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Question Modal (High Z-Index) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white">Add New Question</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-2">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Exam Target</label>
                  <select 
                    value={newQuestion.exam_target}
                    onChange={e => setNewQuestion({...newQuestion, exam_target: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl focus:border-indigo-500 outline-none"
                  >
                    <option value="AFCAT">AFCAT</option>
                    <option value="NDA">NDA</option>
                    <option value="CDS">CDS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                  <select 
                    value={newQuestion.subject}
                    onChange={e => setNewQuestion({...newQuestion, subject: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl focus:border-indigo-500 outline-none"
                  >
                    {subjectsByExam[newQuestion.exam_target]?.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Question Text</label>
                <textarea 
                  value={newQuestion.question}
                  onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl focus:border-indigo-500 outline-none"
                  placeholder="Type the question here..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Option {idx}</label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center pt-3">
                        <input 
                          type="radio" 
                          name="correct_index"
                          checked={newQuestion.correct_index === idx - 1}
                          onChange={() => setNewQuestion({...newQuestion, correct_index: idx - 1})}
                          className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={(newQuestion as any)[`option${idx}`]}
                        onChange={e => setNewQuestion({...newQuestion, [`option${idx}`]: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-xl focus:border-indigo-500 outline-none"
                        placeholder={`Option ${idx}`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="newIsPyq"
                    checked={newQuestion.is_pyq}
                    onChange={e => setNewQuestion({...newQuestion, is_pyq: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="newIsPyq" className="text-sm font-semibold text-slate-300 cursor-pointer">
                    Is Previous Year Question?
                  </label>
                </div>
                {newQuestion.is_pyq && (
                  <input 
                    type="text" 
                    value={newQuestion.pyq_year}
                    onChange={e => setNewQuestion({...newQuestion, pyq_year: e.target.value})}
                    placeholder="e.g. 2023"
                    className="w-32 bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-1.5 rounded-lg focus:border-indigo-500 outline-none"
                  />
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
