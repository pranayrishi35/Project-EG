import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { generateFlashcards } from "@/app/actions/generateFlashcards";

// Lazy-load the heavy 3D client component
const FlashcardViewer = dynamic(() => import("@/components/FlashcardViewer"), {
  ssr: false,
});

function FlashcardSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
      <h2 className="text-lg font-bold text-slate-700">Crafting your flashcards...</h2>
      <p className="text-sm text-slate-500">Gemini AI is analyzing your syllabus.</p>
    </div>
  );
}

// Server Component that fetches data
async function FlashcardDataLoader() {
  const result = await generateFlashcards();

  if (!result.success) {
    let errorMessage = result.error;
    if (result.error === "AI_SERVICE_UNAVAILABLE") {
      errorMessage = "The AI tutor is currently busy. Please try again in a few moments.";
    } else if (result.error === "INSUFFICIENT_CREDITS") {
      errorMessage = "You don't have enough credits to generate flashcards.";
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 text-center animate-fade-in">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-lg font-bold text-red-600 mb-2">{errorMessage}</h2>
        <Link href="/" className="ep-btn-primary mt-4">Return Home</Link>
      </div>
    );
  }

  // Pass the generated data into the lazy-loaded client component
  return <FlashcardViewer flashcards={result.flashcards} focusedSubjects={result.focusedSubjects} />;
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<FlashcardSkeleton />}>
      <FlashcardDataLoader />
    </Suspense>
  );
}
