import { logger } from "~/server/logger";

const log = logger.child({ scope: "xbox" });

// Prices and availability follow the EU store (Ireland, EUR, English)
export const XBOX_MARKET = "IE";
export const XBOX_LANGUAGE = "en-ie";
export const XBOX_STORE_LOCALE = "en-IE";

const DISPLAY_CATALOG_URL =
  "https://displaycatalog.mp.microsoft.com/v7.0/products";
const CATALOG_BATCH_SIZE = 20;

// Microsoft Store product ids are 12 characters, e.g. 9NBLGGH4R315 or BWVBNCMF22ZK
const PRODUCT_ID = /^[0-9A-Z]{12}$/;

// Display catalog response, reduced to the fields we read. Everything is optional because the
// catalog leaves fields out for some products.
interface CatalogImage {
  ImagePurpose?: string;
  Uri?: string;
  Width?: number;
  Height?: number;
}

interface CatalogAvailability {
  Actions?: string[];
  Conditions?: { StartDate?: string; EndDate?: string };
  OrderManagementData?: {
    Price?: { ListPrice?: number; MSRP?: number; CurrencyCode?: string };
  };
}

export interface CatalogProduct {
  ProductId: string;
  LocalizedProperties?: {
    ProductTitle?: string;
    ShortDescription?: string;
    ProductDescription?: string;
    DeveloperName?: string;
    PublisherName?: string;
    Images?: CatalogImage[];
  }[];
  MarketProperties?: { OriginalReleaseDate?: string }[];
  Properties?: { XboxConsoleGenCompatible?: string[] | null };
  DisplaySkuAvailabilities?: {
    Sku?: {
      Properties?: {
        IsTrial?: boolean;
        Packages?: { PlatformDependencies?: { PlatformName?: string }[] }[];
      };
    };
    Availabilities?: CatalogAvailability[];
  }[];
}

export interface XboxProduct {
  productId: string;
  name: string;
  description: string;
  developer: string;
  publisher: string;
  cover: string;
  coverPortrait: string;
  platformIds: string[];
  releaseDate: Date | null;
  storeUrl: string;
}

/**
 * Get the product id from an xbox.com store link, e.g.
 * https://www.xbox.com/en-IE/games/store/some-game/9N0P25WJHM8C
 */
export function extractXboxProductId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)xbox\.com$/i.test(parsed.hostname)) return null;

  const match = /\/games\/store\/[^/]+\/([0-9a-z]{12})\/?$/i.exec(
    parsed.pathname,
  );
  return match?.[1] ? match[1].toUpperCase() : null;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "game"
  );
}

export function xboxStoreUrl(productId: string, name: string): string {
  return `https://www.xbox.com/${XBOX_STORE_LOCALE}/games/store/${slugify(name)}/${productId.toUpperCase()}`;
}

function imageUrl(images: CatalogImage[], purposes: string[]): string {
  for (const purpose of purposes) {
    const uri = images.find((image) => image.ImagePurpose === purpose)?.Uri;
    if (uri) return uri.startsWith("//") ? `https:${uri}` : uri;
  }
  return "";
}

// Catalog text sometimes contains invisible text-direction marks
const DIRECTION_MARKS = /[‎‏‪-‮⁦-⁩]/g;
const clean = (text?: string) =>
  (text ?? "").replace(DIRECTION_MARKS, "").trim();

// Microsoft uses dates in the year 9998 for "to be announced"
const PLACEHOLDER_YEAR = 9000;

/**
 * Turn a display catalog product into the fields the app stores.
 */
export function parseXboxProduct(product: CatalogProduct): XboxProduct {
  const localized = product.LocalizedProperties?.[0];
  const images = localized?.Images ?? [];
  const name = clean(localized?.ProductTitle) || product.ProductId;

  const platformIds: string[] = [];
  const consoleGens = product.Properties?.XboxConsoleGenCompatible ?? [];
  if (consoleGens.includes("ConsoleGen9")) platformIds.push("xbox_series");
  if (consoleGens.includes("ConsoleGen8")) platformIds.push("xbox_one");
  const runsOnPc = (product.DisplaySkuAvailabilities ?? []).some((sku) =>
    (sku.Sku?.Properties?.Packages ?? []).some((pkg) =>
      (pkg.PlatformDependencies ?? []).some(
        (dependency) => dependency.PlatformName === "Windows.Desktop",
      ),
    ),
  );
  if (runsOnPc) platformIds.push("windows");

  const released = product.MarketProperties?.[0]?.OriginalReleaseDate;
  const releaseDate = released ? new Date(released) : null;

  return {
    productId: product.ProductId,
    name,
    description: clean(
      localized?.ShortDescription ?? localized?.ProductDescription,
    ),
    developer: clean(localized?.DeveloperName),
    publisher: clean(localized?.PublisherName),
    cover: imageUrl(images, [
      "SuperHeroArt",
      "TitledHeroArt",
      "BoxArt",
      "Poster",
    ]),
    coverPortrait: imageUrl(images, ["Poster", "BoxArt", "TitledHeroArt"]),
    platformIds: platformIds.length > 0 ? platformIds : ["xbox_series"],
    releaseDate:
      releaseDate &&
      !Number.isNaN(releaseDate.getTime()) &&
      releaseDate.getUTCFullYear() < PLACEHOLDER_YEAR
        ? releaseDate
        : null,
    storeUrl: xboxStoreUrl(product.ProductId, name),
  };
}

/**
 * A free-to-keep offer: a full (not trial) version that can be bought for 0 while its normal
 * price is above 0. Game Pass entitlements (0 with no normal price) and trials don't count.
 * Returns when the offer ends, or null if there's no such offer.
 */
export function findFreeToKeepOffer(
  product: CatalogProduct,
): { endDate: Date | null } | null {
  for (const sku of product.DisplaySkuAvailabilities ?? []) {
    if (sku.Sku?.Properties?.IsTrial) continue;

    for (const availability of sku.Availabilities ?? []) {
      const price = availability.OrderManagementData?.Price;
      if (
        price?.ListPrice === 0 &&
        (price.MSRP ?? 0) > 0 &&
        availability.Actions?.includes("Purchase")
      ) {
        const end = availability.Conditions?.EndDate;
        const endDate = end ? new Date(end) : null;
        return {
          endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
        };
      }
    }
  }
  return null;
}

/**
 * Fetch products from Microsoft's public display catalog for the EU store.
 */
export async function fetchCatalogProducts(
  productIds: string[],
): Promise<CatalogProduct[]> {
  const ids = [...new Set(productIds.map((id) => id.toUpperCase()))].filter(
    (id) => PRODUCT_ID.test(id),
  );
  const products: CatalogProduct[] = [];

  for (let i = 0; i < ids.length; i += CATALOG_BATCH_SIZE) {
    const batch = ids.slice(i, i + CATALOG_BATCH_SIZE);
    const url = `${DISPLAY_CATALOG_URL}?bigIds=${batch.join(",")}&market=${XBOX_MARKET}&languages=${XBOX_LANGUAGE}`;
    const response = await fetch(url);
    if (!response.ok) {
      log.warn("Display catalog request failed", {
        status: response.status,
        ids: batch,
      });
      continue;
    }
    const data = (await response.json()) as { Products?: CatalogProduct[] };
    products.push(...(data.Products ?? []));
  }

  return products;
}
