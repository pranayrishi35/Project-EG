"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/actions/deleteAccount";

export default function DeleteAccountForm() {
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <div className="p-2">
        <button
          type="button"
          onClick={() => setConfirm(true)}
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
      <div className="flex gap-2">
        <form action={deleteAccount} className="flex-1">
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            Yes, delete
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2 rounded-lg border border-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
