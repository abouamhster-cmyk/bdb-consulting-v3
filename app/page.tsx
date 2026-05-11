import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">BDB Consulting</h1>
        <p className="text-gray-600 mb-8">Assistant marketing intelligent</p>
        <Link
          href="/auth"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Accéder à la plateforme
        </Link>
      </div>
    </div>
  )
}