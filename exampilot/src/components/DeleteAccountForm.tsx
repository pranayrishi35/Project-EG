"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/deleteAccount";

export default function DeleteAccountForm() {
  const [confirm, setConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await deleteAccount();
      // If result is returned, it means it failed (success redirects)
      if (result && !result.success) {
        setErrorMsg(result.error);
      }
    });
  };

  if (!confirm) {
    return (
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            setConfirm(true);
            setErrorMsg(null);
          }}
          className="w-full text-red-600 font-semibold text-sm hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors py-2 px-2 text-left"
        >
          Delete Account
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-50/50 border-t border-red-50 flex flex-col gap-3 rounded-b-2xl">
      <p className="text-sm text-red-800 font-medium">
        Are you sure? Your account will be scheduled for deletion.
      </p>
      
      {errorMsg && (
        <div className="p-2 bg-red-100 text-red-700 text-sm rounded border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          {isPending ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={isPending}
          className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold py-2 rounded-lg border border-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
