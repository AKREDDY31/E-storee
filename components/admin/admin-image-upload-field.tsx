"use client";

import { useEffect, useRef, useState } from "react";

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
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState(value);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      setStatus("Use JPG, JPEG, PNG, or WEBP files only.");
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      setStatus("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    setStatus("");

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadedUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.withCredentials = true;
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setStatus(`Uploading ${Math.round((event.loaded / event.total) * 100)}%`);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as { url?: string };
              if (typeof data.url === "string" && data.url.length > 0) {
                resolve(data.url);
                return;
              }
              reject(new Error("Invalid upload response"));
            } catch (error) {
              reject(error);
            }
            return;
          }

          try {
            const data = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(data.error || "Upload failed"));
          } catch (error) {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      onValueChange(uploadedUrl);
      setPreviewUrl(uploadedUrl);
      setStatus("Upload complete.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
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
            void uploadFile(file);
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
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadFile(file);
              }
              event.currentTarget.value = "";
            }}
          />
          {uploading ? <span style={{ color: "var(--muted)" }}>Uploading...</span> : null}
        </div>
      </div>

      {previewUrl ? (
        <div style={{ width: 180, borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "white" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={previewAlt} style={{ width: "100%", display: "block", objectFit: "cover" }} />
        </div>
      ) : null}

      {status ? <span style={{ color: status.toLowerCase().includes("upload") ? "var(--muted)" : "var(--danger)", fontSize: 13 }}>{status}</span> : null}
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