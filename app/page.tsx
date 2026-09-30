import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Loyalty Stamp App</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Digital stamp cards for your business. Customers collect stamps, earn rewards automatically.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-100"
        >
          Login
        </Link>
      </div>
    </main>
  )
}
