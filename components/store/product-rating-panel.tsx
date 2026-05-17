"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export function ProductRatingPanel({
  slug,
  productName,
  currentRating,
  reviewCount
}: {
  slug: string;
  productName: string;
  currentRating: number;
  reviewCount: number;
}) {
  const { session } = useAuth();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitRating() {
    if (!rating) {
      setError("Please choose a rating first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch(`/api/products/${encodeURIComponent(slug)}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating })
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Unable to save rating");
      return;
    }

    setMessage("Thank you. Your rating has been recorded.");
    window.location.reload();
  }

  return (
    <section className="card" style={{ padding: 20, display: "grid", gap: 14, background: "white" }}>
      <strong>Rate this product</strong>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", color: "var(--muted)" }}>
        <span>
          Current rating: {reviewCount && reviewCount > 0 ? currentRating.toFixed(1) : "Not rated yet"}
        </span>
        <span>{reviewCount} customer ratings</span>
      </div>
      {session ? (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  border: value <= rating ? "1px solid var(--brand)" : "1px solid var(--border)",
                  background: value <= rating ? "rgba(13, 92, 67, 0.08)" : "white",
                  color: value <= rating ? "var(--brand)" : "var(--muted)",
                  display: "grid",
                  placeItems: "center"
                }}
                aria-label={`${value} star rating`}
              >
                <Star size={18} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <button className="button" type="button" onClick={submitRating} disabled={saving}>
            {saving ? "Saving..." : `Submit ${rating || ""} star rating`}
          </button>
        </>
      ) : (
        <div style={{ color: "var(--muted)" }}>Please log in to rate {productName}.</div>
      )}
      {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
      {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
    </section>
  );
}