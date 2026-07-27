import Link from "next/link";
import { AssetForm } from "@/components/asset-form";
import {
  listAssetClasses,
  listCurrentProductRevisions,
} from "@/lib/products/service";

export const dynamic = "force-dynamic";

export default async function NewAssetsPage() {
  const [assetClasses, productRevisions] = await Promise.all([
    listAssetClasses(),
    listCurrentProductRevisions(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/assets"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Assets
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Create physical assets
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Identifier allocation is permanent, atomic and never reused.
        </p>
      </div>
      <AssetForm
        assetClasses={assetClasses}
        productRevisions={productRevisions}
      />
    </div>
  );
}
