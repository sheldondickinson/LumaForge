import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { getAssetLabel } from "@/lib/labels/service";

export const dynamic = "force-dynamic";

export default async function AssetLabelPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const label = await getAssetLabel(assetId);
  if (!label) {
    notFound();
  }

  const specification = [
    label.specifications.voltageV ? `${label.specifications.voltageV} V` : null,
    label.specifications.pixelCount
      ? `${label.specifications.pixelCount} pixels`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/assets/${label.id}`}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← {label.assetIdentifier}
        </Link>
        <PrintButton />
      </header>

      <article className="rounded-xl border-2 bg-white p-6 text-black print:border-black">
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_11rem]">
          <div>
            <p className="font-mono text-3xl font-bold tracking-tight">
              {label.assetIdentifier}
            </p>
            <h1 className="mt-3 text-xl font-semibold">
              {label.productName || label.friendlyName}
            </h1>
            {specification ? (
              <p className="mt-2 text-base">{specification}</p>
            ) : null}
            <p className="mt-3 text-sm text-slate-600">{label.friendlyName}</p>
          </div>
          {/* QR and barcode SVGs are generated locally; no external service is used. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={label.qrDataUrl}
            alt={`QR code for ${label.assetIdentifier}`}
            className="aspect-square w-full"
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={label.code128DataUrl}
          alt={`Code 128 barcode for ${label.assetIdentifier}`}
          className="mt-5 h-14 w-full object-contain"
        />
        <p className="mt-2 text-center font-mono text-xs">{label.scanPath}</p>
      </article>
    </div>
  );
}
