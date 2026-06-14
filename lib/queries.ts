import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel, ProductModel, RefundModel, SettingsModel, UserModel } from "@/lib/db/models";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { hashPassword } from "@/lib/auth";
import { type ProductCardData, type StoreSettingsRecord } from "@/types";

const CACHE_TTL_MS = 60_000;

let productsCache: { data: ProductCardData[]; expiresAt: number } | null = null;
let settingsCache: { data: StoreSettingsRecord; expiresAt: number } | null = null;

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

export function invalidateStoreCaches() {
  productsCache = null;
  settingsCache = null;
}

async function loadAllProducts(options?: { bypassCache?: boolean }): Promise<ProductCardData[]> {
  if (!options?.bypassCache && productsCache && isFresh(productsCache.expiresAt)) {
    return productsCache.data;
  }

  try {
    await connectToDatabase();
    const products = JSON.parse(
      JSON.stringify(await ProductModel.find().sort({ featured: -1, createdAt: -1 }).lean())
    ) as ProductCardData[];

    const normalized = products.map((product) => ({
      ...product,
      deliveryPrice: typeof product.deliveryPrice === "number" ? product.deliveryPrice : 60
    })) as ProductCardData[];

    productsCache = {
      data: normalized,
      expiresAt: Date.now() + CACHE_TTL_MS
    };

    return normalized;
  } catch {
    return [];
  }
}

export async function getProducts(filters?: {
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
  bypassCache?: boolean;
}) {
  const products = await loadAllProducts({ bypassCache: filters?.bypassCache });
  return products.filter((product) => {
    if (filters?.category && product.category !== filters.category) return false;
    if (filters?.brand && product.brand !== filters.brand) return false;
    if (filters?.featured && !product.featured) return false;
    if (filters?.search) {
      const text = `${product.name} ${product.description} ${product.category} ${product.brand}`.toLowerCase();
      return text.includes(filters.search.toLowerCase());
    }
    return true;
  });
}

export async function getProductBySlug(slug: string) {
  const products = await loadAllProducts();
  return products.find((product) => product.slug === slug) || null;
}

export async function getFreshProducts(filters?: {
  category?: string;
  brand?: string;
  search?: string;
  featured?: boolean;
}) {
  return getProducts({ ...filters, bypassCache: true });
}

export async function getFreshProductBySlug(slug: string) {
  const products = await loadAllProducts({ bypassCache: true });
  return products.find((product) => product.slug === slug) || null;
}

export async function getDashboardMetrics() {
  try {
    await connectToDatabase();

    const activeOrderFilter = { orderStatus: { $nin: ["cancelled", "refunded"] } };

    const [productCount, activeOrderCount, cancelledOrderCount, refundCount, revenue] = await Promise.all([
      ProductModel.countDocuments(),
      OrderModel.countDocuments(activeOrderFilter),
      OrderModel.countDocuments({ orderStatus: "cancelled" }),
      RefundModel.countDocuments(),
      OrderModel.aggregate([
        {
          $match: {
            ...activeOrderFilter,
            paymentStatus: { $in: ["paid", "pending", "awaiting_verification"] }
          }
        },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ])
    ]);

    return {
      productCount,
      activeOrderCount,
      cancelledOrderCount,
      refundCount,
      revenue: revenue[0]?.total || 0
    };
  } catch {
    return {
      productCount: 0,
      activeOrderCount: 0,
      cancelledOrderCount: 0,
      refundCount: 0,
      revenue: 0
    };
  }
}

export async function ensureStoreSettings(): Promise<StoreSettingsRecord> {
  if (settingsCache && isFresh(settingsCache.expiresAt)) {
    return settingsCache.data;
  }

  await connectToDatabase();
  let settings = (await SettingsModel.findOne({ key: "store" }).lean()) as StoreSettingsRecord | null;
  if (!settings) {
    const secret = process.env.ADMIN_SECRET_CODE || "005577";
    const adminSecretHash = await hashPassword(secret);
    settings = JSON.parse(
      JSON.stringify(
        await SettingsModel.create({
          key: "store",
          ...DEFAULT_STORE_SETTINGS,
          adminSecretHash
        })
      )
    ) as StoreSettingsRecord;
  } else {
    settings = JSON.parse(JSON.stringify(settings)) as StoreSettingsRecord;
  }

  settingsCache = {
    data: settings,
    expiresAt: Date.now() + CACHE_TTL_MS
  };

  return settings;
}

export async function getStoreSettings(): Promise<StoreSettingsRecord> {
  try {
    const settings = await ensureStoreSettings();
    return settings;
  } catch {
    return {
      ...DEFAULT_STORE_SETTINGS,
      adminSecretHash: ""
    };
  }
}

export async function getUsers() {
  try {
    await connectToDatabase();
    return JSON.parse(JSON.stringify(await UserModel.find().sort({ createdAt: -1 }).lean())) as any[];
  } catch {
    return [] as any[];
  }
}
