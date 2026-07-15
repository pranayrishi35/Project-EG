"use client";

import { useState } from "react";
import Link from "next/link";

export function LegalFooter() {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  return (
    <>
      <footer className="mt-20 py-8 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Legal Documents</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/terms" className="hover:text-indigo-600">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-indigo-600">Privacy Policy</Link></li>
                <li><Link href="/aup" className="hover:text-indigo-600">Acceptable Usage Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-indigo-600">Refund & Cancellation Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-indigo-600">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Grievance Officer</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> Grievance Officer</p>
                <p><strong>Email:</strong> grievance@exampilot.com</p>
                <p><strong>Address:</strong> ExamPilot Registered Office, Bengaluru, Karnataka, India</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} ExamPilot. All rights reserved.</p>
            <button 
              onClick={() => setIsCookieModalOpen(true)} 
              className="hover:text-gray-900 hover:underline"
            >
              Cookie Preferences
            </button>
          </div>
        </div>
      </footer>

      {/* Cookie Preferences Modal */}
      {isCookieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
              <button 
                onClick={() => setIsCookieModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              ExamPilot currently uses only strictly necessary authentication cookies. No non-essential tracking or advertising cookies are active, so no preferences need to be managed at this time.
            </p>
            <button 
              onClick={() => setIsCookieModalOpen(false)}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
