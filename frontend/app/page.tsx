// Keep this as a Server Component. No hooks here.
export default async function HomePage() {
  // (Optional) You can fetch active items here server-side later.
  // For now, leave simple scaffolding to ensure the build is happy.

  return (
    <section className="p-6">
      <div className="mb-4 flex items-center gap-3">
        {/* Placeholder filters/sort; wire up later */}
        <select className="border rounded px-2 py-1">
          <option value="">All categories</option>
        </select>
        <select className="border rounded px-2 py-1">
          <option value="ending_soon">Ending soon</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Active auctions</h2>
        {/* Replace with a real list component later */}
        <p className="text-sm text-gray-600">
          (Results will appear here once wired to the API.)
        </p>
      </div>
    </section>
  );
}