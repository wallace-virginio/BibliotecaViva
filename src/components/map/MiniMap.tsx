import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { Library } from "@/data/libraries";

const LibraryMap = lazy(() => import("./LibraryMap.client"));

export function MiniMap({ lib, className }: { lib: Library; className?: string }) {
  return (
    <div className={className}>
      <ClientOnly fallback={<div className="skeleton size-full" />}>
        <Suspense fallback={<div className="skeleton size-full" />}>
          <LibraryMap className="size-full" libraries={[lib]} activeSlug={lib.slug} view={{ lat: lib.lat, lon: lib.lon, zoom: 15 }} onSelect={() => {}} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
