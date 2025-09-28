import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 p-6">
      <div className="max-w-xl w-full text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
          <svg className="h-8 w-8 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          We couldn’t find the page you’re looking for. It may have been moved or deleted.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Back to home
          </Link>

          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-md bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            Search site
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Tip: If you followed a link here, try returning to the previous page or go to the home page.
        </p>
      </div>
    </div>
  )
}