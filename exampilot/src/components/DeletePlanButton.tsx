"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlan } from "@/app/actions/deletePlan";

interface DeletePlanButtonProps {
  planId: string;
  planName: string;
}

export default function DeletePlanButton({ planId, planName }: DeletePlanButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete(e: React.MouseEvent) {
    // Stop the parent <Link> from navigating to the plan
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${planName}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deletePlan(planId);
      if (!result.success) {
        alert(result.error);
        return;
      }
      // revalidatePath in the action updates server cache;
      // router.refresh() makes the client pick up the new HTML.
      router.refresh();
    });
  }

  return (
    <button
      id={`delete-plan-${planId}`}
      data-testid="delete-plan-button"
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={`Delete ${planName}`}
      title="Delete plan"
      className={[
        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
        "text-gray-300 hover:text-red-500 hover:bg-red-50",
        "transition-all duration-150 active:scale-90",
        "disabled:opacity-40 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {isPending ? (
        /* Spinner while deleting */
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-red-400 animate-spin"
          aria-hidden="true"
        />
      ) : (
        /* Trash icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      )}
    </button>
  );
}
