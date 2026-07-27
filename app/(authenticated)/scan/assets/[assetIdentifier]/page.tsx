import { notFound, redirect } from "next/navigation";
import { findAssetIdByIdentifier } from "@/lib/labels/service";

export const dynamic = "force-dynamic";

export default async function ScanAssetPage({
  params,
}: {
  params: Promise<{ assetIdentifier: string }>;
}) {
  const { assetIdentifier } = await params;
  const assetId = await findAssetIdByIdentifier(
    decodeURIComponent(assetIdentifier),
  );
  if (!assetId) {
    notFound();
  }

  redirect(`/assets/${assetId}`);
}
