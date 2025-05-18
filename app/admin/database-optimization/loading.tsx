export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6">
              <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 w-full bg-gray-700 rounded mb-4"></div>
              <div className="h-10 w-full bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
