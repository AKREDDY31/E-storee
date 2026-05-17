import Image from "next/image";

export function ProductImage({
  src,
  alt
}: {
  src?: string;
  alt: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={520}
        height={520}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 240,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top, rgba(212,175,55,0.3), transparent 35%), linear-gradient(135deg, #f8f2e3, #eef7ef)",
        color: "var(--brand-deep)",
        fontWeight: 900,
        letterSpacing: "0.08em",
        padding: 20,
        textAlign: "center"
      }}
    >
      {alt}
    </div>
  );
}
