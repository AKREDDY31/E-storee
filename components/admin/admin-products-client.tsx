"use client";

import { useState, type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_ORDER } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { type ProductCardData } from "@/types";

export function AdminProductsClient({
  initialProducts
}: {
  initialProducts: ProductCardData[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [editingCode, setEditingCode] = useState("");

  async function compressImage(file: File) {
    if (file.type === "image/webp" && file.size <= 1024 * 1024) {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob) {
      return file;
    }

    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");
    setImagePreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", await compressImage(file));

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    setUploading(false);

    if (response.ok) {
      const imageField = document.getElementById("admin-image-url") as HTMLInputElement | null;
      if (imageField) {
        imageField.value = data.url;
      }
      setUploadMessage("Image uploaded successfully.");
    } else {
      setUploadMessage(data.error || "Upload failed");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const originalItemCode = editingCode;
    if (originalItemCode) {
      payload.originalItemCode = originalItemCode;
    }
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      setProducts((current) => [data.product, ...current.filter((item) => item.itemCode !== originalItemCode && item.itemCode !== data.product.itemCode)]);
      event.currentTarget.reset();
      setEditingCode("");
      setFormMessage(editingCode ? "Product updated successfully." : "Product added successfully.");
      router.refresh();
      return;
    }

    const detailsMessage =
      typeof data?.details?.message === "string" && data.details.message.trim().length > 0
        ? data.details.message
        : "";

    setFormMessage(detailsMessage || data.error || "Failed to save product");
  }

  async function handleDelete(itemCode: string) {
    if (!window.confirm(`Delete ${itemCode}? This cannot be undone.`)) {
      return;
    }

    const response = await fetch(`/api/admin/products?itemCode=${encodeURIComponent(itemCode)}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!response.ok) {
      return;
    }

    setProducts((current) => current.filter((item) => item.itemCode !== itemCode));
    if (editingCode === itemCode) {
      const form = document.getElementById("admin-product-form") as HTMLFormElement | null;
      form?.reset();
      setEditingCode("");
    }
  }

  function startEdit(product: ProductCardData) {
    const form = document.getElementById("admin-product-form") as HTMLFormElement | null;
    if (!form) return;
    setEditingCode(product.itemCode);
    const setValue = (name: string, value: string | number | undefined) => {
      const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (field) field.value = value === undefined ? "" : String(value);
    };
    setValue("name", product.name);
    setValue("brand", product.brand);
    setValue("category", product.category);
    setValue("itemCode", product.itemCode);
    setValue("mrp", product.mrp);
    setValue("discountPercent", product.discountPercent);
    setValue("deliveryPrice", product.deliveryPrice);
    setValue("stock", product.stock);
    setValue("imageUrl", product.imageUrl);
    setValue("description", product.description);
    setValue("tags", product.tags.join(", "));
    setValue("benefits", product.benefits.join(", "));
    setValue("ingredients", product.ingredients?.join(", "));
    setValue("howToUse", product.howToUse?.join(", "));
    setImagePreview(product.imageUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Product management</h1>
      <form id="admin-product-form" className="card" onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 12, borderRadius: 28, background: "linear-gradient(180deg, #ffffff, #f8fbf8)" }}>
        <strong>{editingCode ? `Editing ${editingCode}` : "Add or update product"}</strong>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Basic details</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Field label="Product name"><input name="name" required placeholder="Example: MK Biotech ZIO-CID 200ml" style={fieldStyle} /></Field>
            <Field label="Brand"><input name="brand" required placeholder="Example: MK Biotech" style={fieldStyle} /></Field>
            <Field label="Category">
              <select name="category" required style={fieldStyle}>
                {CATEGORY_ORDER.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Item code"><input name="itemCode" required placeholder="Example: VED008" style={fieldStyle} /></Field>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Pricing and stock</div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Field label="MRP"><input name="mrp" required type="number" min="1" placeholder="Maximum retail price" style={fieldStyle} /></Field>
            <Field label="Discount %"><input name="discountPercent" required type="number" min="0" max="99" placeholder="Offer percentage" style={fieldStyle} /></Field>
            <Field label="Delivery price"><input name="deliveryPrice" required type="number" min="0" defaultValue={60} placeholder="Delivery charge for this product" style={fieldStyle} /></Field>
            <Field label="Units in stock"><input name="stock" required type="number" min="0" placeholder="Available inventory" style={fieldStyle} /></Field>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Sale price is calculated automatically from the MRP and discount percentage.</div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Media</div>
          <Field label="Product image URL"><input id="admin-image-url" name="imageUrl" placeholder="Paste an uploaded image path or a direct URL" style={fieldStyle} /></Field>
          <div style={{ display: "grid", gap: 8 }}>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageUpload} />
          {imagePreview ? (
            <div style={{ width: 180, borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Product preview" style={{ width: "100%", display: "block", objectFit: "cover" }} />
            </div>
          ) : null}
          {uploading ? <span style={{ color: "var(--muted)" }}>Uploading image...</span> : null}
          {uploadMessage ? (
            <span style={{ color: uploadMessage.includes("success") ? "var(--success)" : "var(--danger)" }}>
              {uploadMessage}
            </span>
          ) : null}
        </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>Content and details</div>
          <Field label="Description">
            <textarea
              name="description"
              required
              minLength={10}
              placeholder="Describe the product in a clear paragraph"
              style={{ ...fieldStyle, height: 108, paddingTop: 12 }}
            />
          </Field>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <Field label="Tags"><input name="tags" placeholder="Comma-separated tags" style={fieldStyle} /></Field>
            <Field label="Benefits"><input name="benefits" placeholder="Comma-separated benefits" style={fieldStyle} /></Field>
            <Field label="Ingredients"><input name="ingredients" placeholder="Comma-separated ingredients" style={fieldStyle} /></Field>
            <Field label="How to use"><input name="howToUse" placeholder="Comma-separated steps" style={fieldStyle} /></Field>
          </div>
        </section>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="button" disabled={saving} type="submit">
            {saving ? "Saving..." : editingCode ? "Update product" : "Save product"}
          </button>
          {editingCode ? (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                const form = document.getElementById("admin-product-form") as HTMLFormElement | null;
                form?.reset();
                setEditingCode("");
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
        {formMessage ? (
          <div style={{ color: formMessage.toLowerCase().includes("success") ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
            {formMessage}
          </div>
        ) : null}
      </form>

      <div className="card" style={{ padding: 24, display: "grid", gap: 12, borderRadius: 28 }}>
        <strong>Current products</strong>
        <div style={{ display: "grid", gap: 12 }}>
          {products.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No products added yet. Add products from the form above.</div>
          ) : null}
          {products.map((product) => (
            <div key={product.itemCode} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12, alignItems: "center" }}>
              <div>
                <strong>{product.name}</strong>
                <div style={{ color: "var(--muted)" }}>{product.category} | {product.brand}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  Rating {product.rating?.toFixed(1) || "0.0"} | Reviews {product.reviewCount || 0} | Bought {product.purchaseCount || 0}
                </div>
              </div>
              <strong>{formatCurrency(product.price)}</strong>
              <span style={{ color: "var(--muted)" }}>Stock {product.stock}</span>
              <button className="button secondary" type="button" onClick={() => startEdit(product)}>
                Edit
              </button>
              <button className="button secondary" type="button" onClick={() => handleDelete(product.itemCode)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontWeight: 700, color: "var(--text)" }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      {children}
    </label>
  );
}

const fieldStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px"
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 16,
  border: "1px solid var(--border)",
  borderRadius: 20,
  background: "rgba(255,255,255,0.7)"
};

const sectionHeaderStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 15,
  color: "var(--brand-deep)"
};
