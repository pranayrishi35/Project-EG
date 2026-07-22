"use client";

import { useState, useTransition } from "react";
import { recoverAccount } from "@/app/actions/recoverAccount";

export default function RecoverAccountForm() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRecover = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await recoverAccount();
      if (result && !result.success) {
        setErrorMsg(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}
      <button
        type="button"
        onClick={handleRecover}
        disabled={isPending}
        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Recovering..." : "Recover My Account"}
      </button>
    </div>
  );
}
