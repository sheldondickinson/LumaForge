import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductRevisionForm } from "@/components/product-revision-form";
import { formatAustralianDateTime } from "@/lib/format";
import { getProductDetail } from "@/lib/products/service";

export const dynamic = "force-dynamic";

function specificationLabel(key: string) {
  const labels: Record<string, string> = {
    voltageV: "Voltage",
    pixelCount: "Pixel count",
    spacingMm: "Spacing",
    protocol: "Protocol",
    connector: "Connector",
  };
  return labels[key] ?? key;
}

function specificationValue(key: string, value: unknown) {
  if (key === "voltageV") return `${String(value)} V`;
  if (key === "spacingMm") return `${String(value)} mm`;
  return String(value);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProductDetail(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/products"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Products
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium">
            Revision {product.revisionNumber}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {product.assetClassName} ({product.assetClassPrefix})
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">Catalogue details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Manufacturer / model</dt>
              <dd className="font-medium">
                {[product.manufacturer, product.model]
                  .filter(Boolean)
                  .join(" / ") || "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Description</dt>
              <dd className="font-medium">
                {product.description || "Not recorded"}
              </dd>
            </div>
          </dl>
        </article>
        <article className="rounded-xl border bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">Specifications</h2>
          {Object.keys(product.specifications).length === 0 ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              No structured specifications recorded.
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-slate-500">{specificationLabel(key)}</dt>
                  <dd className="font-medium">
                    {specificationValue(key, value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      </section>

      <ProductRevisionForm product={product} />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Revision history</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Historical revisions are immutable.
          </p>
        </div>
        <ol className="space-y-3">
          {product.revisions.map((revision) => (
            <li
              key={revision.id}
              className="rounded-xl border bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-semibold">
                  Revision {revision.revisionNumber}: {revision.name}
                </h3>
                <time className="text-sm text-slate-500">
                  {formatAustralianDateTime(revision.createdAt)}
                </time>
              </div>
              <p className="mt-2 text-sm">{revision.changeSummary}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
