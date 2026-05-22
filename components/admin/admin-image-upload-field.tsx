"use client";

import { useEffect, useState } from "react";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type AdminImageUploadFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  helpText?: string;
  previewAlt: string;
};

export function AdminImageUploadField({
  id,
  name,
  label,
  value,
  onValueChange,
  placeholder,
  helpText,
  previewAlt
}: AdminImageUploadFieldProps) {
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState(value);

  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  function readAsDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(blob);
    });
  }

  async function prepareImage(file: File) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      setStatus("Use JPG, JPEG, PNG, or WEBP files only.");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      setStatus("Image must be under 5MB.");
      return;
    }

    try {
      setStatus("Preparing image...");

      const bitmap = await createImageBitmap(file);
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        const fallbackDataUrl = await readAsDataUrl(file);
        onValueChange(fallbackDataUrl);
        setPreviewUrl(fallbackDataUrl);
        setStatus("Image ready. Save to publish it.");
        return;
      }

      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      const dataUrl = blob ? await readAsDataUrl(blob) : await readAsDataUrl(file);
      onValueChange(dataUrl);
      setPreviewUrl(dataUrl);
      setStatus("Image ready. Save to publish it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label htmlFor={id} style={{ display: "grid", gap: 6, fontWeight: 700, color: "var(--text)" }}>
        <span style={{ fontSize: 14 }}>{label}</span>
        <input
          id={id}
          name={name}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setPreviewUrl(event.target.value);
          }}
          placeholder={placeholder}
          style={inputStyle}
        />
      </label>

      <div
        style={dropzoneStyle}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) {
            void prepareImage(file);
          }
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 14 }}>Drop a JPG, JPEG, PNG, or WEBP file here</strong>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>{helpText || "Or choose a file to upload instantly with live progress."}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void prepareImage(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      {previewUrl ? (
        <div style={{ width: 180, borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "white" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={previewAlt} style={{ width: "100%", display: "block", objectFit: "cover" }} />
        </div>
      ) : null}

      {status ? <span style={{ color: status.toLowerCase().includes("ready") || status.toLowerCase().includes("preparing") ? "var(--muted)" : "var(--danger)", fontSize: 13 }}>{status}</span> : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px"
};

const dropzoneStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px dashed var(--border)",
  background: "rgba(255,255,255,0.72)",
  padding: 16,
  display: "grid",
  gap: 12
};