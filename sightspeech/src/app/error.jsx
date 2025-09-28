'use client'

import Link from 'next/link'

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-start gap-5">
          <div className="flex-none">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01" />
              </svg>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred while loading this page. You can try reloading the section or go back to the home page.
            </p>

            <div className="mt-4">
              <div className="text-xs text-gray-500">Error message</div>
              <pre className="mt-1 max-h-28 overflow-auto text-sm text-red-700 bg-red-50 rounded-md p-3 break-words">
                {error?.message ?? 'Unknown error'}
              </pre>

              {error?.stack && (
                <details className="mt-3 text-xs text-gray-500">
                  <summary className="cursor-pointer select-none">Show stack trace</summary>
                  <pre className="mt-2 max-h-40 overflow-auto text-xs text-gray-600 bg-gray-50 rounded-md p-3">{error.stack}</pre>
                </details>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Try again
              </button>

              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-md bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          If this keeps happening, check the browser console for details and contact support with the error message above.
        </div>
      </div>
    </div>
  )
}