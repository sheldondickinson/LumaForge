import Link from "next/link";
import { listProducts } from "@/lib/products/service";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q ?? "";
  const products = await listProducts(query);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--accent)] uppercase">
            Catalogue
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Shared specifications are revisioned separately from physical
            assets.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 font-semibold text-[var(--accent-foreground)]"
        >
          Create product
        </Link>
      </header>

      <form action="/products" className="flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search products, manufacturers or models"
          className="min-h-11 min-w-0 flex-1 rounded-lg border bg-[var(--surface)] px-3"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg border px-4 font-medium"
        >
          Search
        </button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border bg-[var(--surface)] p-8 text-center">
          <h2 className="text-lg font-semibold">No products found</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {query
              ? "Try a different search."
              : "Create the first product definition to begin the catalogue."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Manufacturer / model
                </th>
                <th className="px-4 py-3 font-semibold">Revision</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-semibold text-[var(--accent)] hover:underline"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {product.assetClassName} ({product.assetClassPrefix})
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {[product.manufacturer, product.model]
                      .filter(Boolean)
                      .join(" / ") || "—"}
                  </td>
                  <td className="px-4 py-3">{product.revisionNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
