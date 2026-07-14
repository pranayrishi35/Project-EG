"use client";

import { useEffect, useState } from "react";
import { getBookletContent, BookletQuestion } from "@/app/actions/getBooklets";
import Link from "next/link";


export default function BookletPrintView({ params }: { params: { exam: string, subject: string } }) {
  const [questions, setQuestions] = useState<BookletQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const examTarget = decodeURIComponent(params.exam);
  const decodedSubject = decodeURIComponent(params.subject);

  useEffect(() => {
    async function load() {
      const { data, hasMore: initialHasMore } = await getBookletContent(examTarget, decodedSubject, 0, 20);
      setQuestions(data);
      setHasMore(initialHasMore);
      setLoading(false);
    }
    load();
  }, [examTarget, decodedSubject]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data, hasMore: nextHasMore } = await getBookletContent(examTarget, decodedSubject, nextPage, 20);
      setQuestions((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(nextHasMore);
    } catch (error) {
      console.error("Failed to load more questions:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 pt-6 pb-24 max-w-4xl mx-auto gap-4 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 rounded-lg" />
        <div className="h-6 w-32 bg-gray-100 rounded-md mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col gap-3 p-6 bg-white rounded-3xl border border-gray-100">
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="h-4 w-1/2 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white pb-24 print:pb-0">
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-8 print:p-0">
        
        {/* Navigation & Controls (Hidden when printing) */}
        <div className="print:hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <Link
            href="/booklets"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            ← Back to Directory
          </Link>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 print:hidden"
          >
            <span aria-hidden="true">🖨️</span> Print Booklet
          </button>
        </div>

        {/* Exam Header */}
        <div className="mb-10 border-b-2 border-gray-900 pb-6 print:border-black print:pb-4">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight print:text-black">
            {examTarget} - {decodedSubject}
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1 print:text-black">
            Official Mock Booklet • {questions.length} Questions
          </p>
        </div>

        {/* Questions Grid Grouped by Subject */}
        <div className="flex flex-col gap-8 print:gap-6">
          {Object.entries(
            questions
              .filter((q) => q.question && q.question.trim().length > 0)
              .reduce((acc, q) => {
                const subj = q.subject || decodedSubject;
                acc[subj] = acc[subj] || [];
                acc[subj].push(q);
                return acc;
              }, {} as Record<string, typeof questions>)
          ).map(([subjectName, subjectQs]) => (
            <div key={subjectName} className="flex flex-col gap-8 print:gap-6">
              <h3 className="text-xl font-bold text-indigo-400 mt-8 mb-4 border-b border-gray-200 pb-2 print:text-black print:border-black break-after-avoid">
                {subjectName} Section
              </h3>
              {subjectQs.map((q, index) => (
                <div 
                  key={q.id} 
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-transparent break-inside-avoid"
                >
                  <h3 className="text-base font-bold text-gray-900 mb-4 print:text-black flex gap-3">
                    <span className="shrink-0">{index + 1}.</span>
                    <span>{q.question}</span>
                  </h3>
                  
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pl-8">
                    {q.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i); // A, B, C, D
                      const isCorrect = i === q.correct_index;
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-gray-700 print:text-black">({letter})</span>
                          <span className={`text-gray-600 print:text-black ${isCorrect ? "font-bold text-emerald-700 underline print:text-black" : ""}`}>
                            {opt}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {questions.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            No questions found for this exam and subject.
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-10 print:hidden">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Questions"
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
