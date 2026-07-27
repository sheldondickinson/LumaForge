import "server-only";

import bwipjs from "bwip-js/node";
import QRCode from "qrcode";
import { getDatabaseConnection } from "@/db/client";

export type AssetLabel = {
  id: string;
  assetIdentifier: string;
  friendlyName: string;
  productName: string | null;
  specifications: Record<string, string | number | boolean | null>;
  scanPath: string;
  qrDataUrl: string;
  code128DataUrl: string;
};

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function getAssetLabel(
  assetId: string,
): Promise<AssetLabel | null> {
  const { client } = getDatabaseConnection();
  const [asset] = await client<
    Array<{
      id: string;
      assetIdentifier: string;
      friendlyName: string;
      productName: string | null;
      specifications: Record<string, string | number | boolean | null>;
    }>
  >`
    select
      assets.id,
      assets.asset_identifier as "assetIdentifier",
      assets.friendly_name as "friendlyName",
      product_revisions.name as "productName",
      coalesce(product_revisions.specifications, '{}'::jsonb) as specifications
    from assets
    left join product_revisions
      on product_revisions.id = assets.product_revision_id
    where assets.id = ${assetId}
  `;

  if (!asset) {
    return null;
  }

  const scanPath = `/scan/assets/${encodeURIComponent(asset.assetIdentifier)}`;
  const qrSvg = await QRCode.toString(scanPath, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 384,
  });
  const code128Svg = bwipjs.toSVG({
    bcid: "code128",
    text: asset.assetIdentifier,
    includetext: false,
    scale: 3,
    height: 12,
  });

  return {
    ...asset,
    scanPath,
    qrDataUrl: svgDataUrl(qrSvg),
    code128DataUrl: svgDataUrl(code128Svg),
  };
}

export async function findAssetIdByIdentifier(assetIdentifier: string) {
  const { client } = getDatabaseConnection();
  const [asset] = await client<{ id: string }[]>`
    select id
    from assets
    where asset_identifier = ${assetIdentifier.trim().toUpperCase()}
  `;

  return asset?.id ?? null;
}
