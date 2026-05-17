import { Suspense } from "react";
import { TrackOrderClient } from "@/components/store/track-order-client";

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="container section">Loading tracker...</div>}>
      <TrackOrderClient />
    </Suspense>
  );
}
