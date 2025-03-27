import { encodeBase64Url } from "jsr:@std/encoding";
import { crypto } from "jsr:@std/crypto/crypto";

// Custom Types

export type ShortLink = {
  shortCode: string;
  longUrl: string;
  createdAt: number;
  clickCount: number;
  lastClickEvent?: string;
};

export type ClickAnalytics = {
  shortUrl: string;
  createdAt: number;
  ipAddress: string;
  userAgent: string;
  country?: string;
};

// Read & Write Data with Deno KV

export async function generateShortCode(longUrl: string) {
  try {
    new URL(longUrl);
  } catch (error) {
    console.log(error);
    throw new Error("Invalid URL provided");
  }

  // Generate a unique identifier for the URL
  const urlData = new TextEncoder().encode(longUrl + Date.now());
  const hash = await crypto.subtle.digest("SHA-256", urlData);

  // Take the first 8 of the hash for the short URL
  const shortCode = encodeBase64Url(hash.slice(0, 8));

  return shortCode;
}

const kv = await Deno.openKv();

export async function storeShortLink(
    longUrl: string,
    shortCode: string,
) {
  const shortLinkKey = ["shortlinks", shortCode];
  const data: ShortLink = {
    shortCode,
    longUrl,
    createdAt: Date.now(),
    clickCount: 0,
  };

  const res = await kv.atomic()
      .set(shortLinkKey, data)
      .commit();

  return res;
}

export async function getShortLink(shortCode: string) {
  const link = await kv.get<ShortLink>(["shortlinks", shortCode]);
  return link.value;
}

export async function getAllLinks() {
  const list = kv.list<ShortLink>({ prefix: ["shortlinks"] });
  const res = await Array.fromAsync(list);
  const linkValues = res.map((v) => v.value);
  return linkValues;
}

// Realtime Analytics

export function watchShortLink(shortCode: string) {
  const shortLinkKey = ["shortlinks", shortCode];
  const shortLinkStream = kv.watch<ShortLink[]>([shortLinkKey]).getReader();
  return shortLinkStream;
}

export async function getClickEvent(shortCode: string, clickId: number) {
  const analytics = await kv.get<ClickAnalytics>([
    "analytics",
    shortCode,
    clickId,
  ]);
  return analytics.value;
}

export async function incrementClickCount(
    shortCode: string,
    data?: Partial<ClickAnalytics>,
) {
  const shortLinkKey = ["shortlinks", shortCode];
  const shortLink = await kv.get(shortLinkKey);
  const shortLinkData = shortLink.value as ShortLink;

  const newClickCount = shortLinkData?.clickCount + 1;

  const analyicsKey = ["analytics", shortCode, newClickCount];
  const analyticsData = {
    shortCode,
    createdAt: Date.now(),
    ...data,
  };

  const res = await kv.atomic()
      .check(shortLink)
      .set(shortLinkKey, {
        ...shortLinkData,
        clickCount: newClickCount,
      })
      .set(analyicsKey, analyticsData)
      .commit();

  if (!res.ok) {
    console.error("Error recording click!");
  }

  return res;
}
