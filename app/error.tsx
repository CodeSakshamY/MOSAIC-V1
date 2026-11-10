"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <article className="section-page">
      <header className="page-header">
        <h1>This page could not be loaded</h1>
        <p className="lede">Something went wrong while rendering this view.</p>
      </header>
      <div className="gallery-row mt-6">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </article>
  );
}
