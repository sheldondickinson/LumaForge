import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { listAssetClasses } from "@/lib/products/service";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const assetClasses = await listAssetClasses();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/products"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Products
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Create product
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This creates revision 1. Future edits append revisions rather than
          rewriting this record.
        </p>
      </div>
      <ProductForm assetClasses={assetClasses} />
    </div>
  );
}
