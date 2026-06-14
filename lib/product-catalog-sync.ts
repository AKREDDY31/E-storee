const PRODUCT_CATALOG_STORAGE_KEY = "vedics-product-catalog-updated";
export const PRODUCT_CATALOG_UPDATE_EVENT = "vedics-product-catalog-update";

export function broadcastProductCatalogUpdate() {
  if (typeof window === "undefined") return;

  const timestamp = String(Date.now());

  try {
    window.localStorage.setItem(PRODUCT_CATALOG_STORAGE_KEY, timestamp);
  } catch {
    // Ignore storage failures and still notify the current tab.
  }

  window.dispatchEvent(new Event(PRODUCT_CATALOG_UPDATE_EVENT));
}

export function subscribeToProductCatalogUpdates(onUpdate: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PRODUCT_CATALOG_STORAGE_KEY) {
      onUpdate();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(PRODUCT_CATALOG_UPDATE_EVENT, onUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(PRODUCT_CATALOG_UPDATE_EVENT, onUpdate);
  };
}