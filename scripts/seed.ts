import { connectToDatabase } from "@/lib/db/connect";
import { ProductModel, SettingsModel, UserModel } from "@/lib/db/models";
import { seedProducts } from "@/lib/data/products";
import { hashPassword } from "@/lib/auth";
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants";
import { invalidateStoreCaches } from "@/lib/queries";

async function main() {
  await connectToDatabase();

  for (const product of seedProducts) {
    await ProductModel.updateOne({ itemCode: product.itemCode }, product, { upsert: true });
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
    await UserModel.updateOne(
      { email: process.env.ADMIN_EMAIL },
      {
        name: "Vedics Admin",
        email: process.env.ADMIN_EMAIL,
        passwordHash,
        role: "admin"
      },
      { upsert: true }
    );
  }

  const adminSecretHash = await hashPassword(process.env.ADMIN_SECRET_CODE || "005577");
  await SettingsModel.updateOne(
    { key: "store" },
    {
      key: "store",
      ...DEFAULT_STORE_SETTINGS,
      adminSecretHash
    },
    { upsert: true }
  );

  console.log(`Seeded ${seedProducts.length} products.`);
  invalidateStoreCaches();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
