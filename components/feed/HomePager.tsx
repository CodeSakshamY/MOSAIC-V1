"use client";

import { useEffect, useRef, useState } from "react";
import { HomeCard } from "@/components/feed/HomeCard";
import { loadMoreHome } from "@/lib/feed/more";
import type { HomeItem, HomeTab } from "@/lib/feed/home";

export function HomePager({
  tab,
  cursor,
  dismiss,
}: {
  tab: HomeTab;
  cursor: string;
  dismiss: boolean;
}) {
  const [pages, setPages] = useState<HomeItem[][]>([]);
  const [next, setNext] = useState<string | null>(cursor);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const nextRef = useRef<string | null>(cursor);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  async function more() {
    const cursorNow = nextRef.current;
    if (!cursorNow || busy.current) return;
    busy.current = true;
    setLoading(true);
    const result = await loadMoreHome(tab, cursorNow);
    setPages((current) => [...current, result.items]);
    nextRef.current = result.nextCursor;
    setNext(result.nextCursor);
    setLoading(false);
    busy.current = false;
  }

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !next) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void more();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [next, pages.length]);

  return (
    <>
      {pages.map((page, index) => (
        <ul key={page[0]?.id ?? `page-${index}`} className="repo-list" role="list">
          {page.map((item) => (
            <HomeCard key={item.id} item={item} dismiss={dismiss} />
          ))}
        </ul>
      ))}
      {next ? (
        <div ref={sentinel}>
          <button className="text-button" type="button" onClick={() => void more()} disabled={loading}>
            {loading ? "Loading" : "Load more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
