"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      // Clipboard can be blocked. Fall through to the system share sheet.
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
      } catch {
        // The person closed the share sheet.
      }
    }
  }

  return (
    <button className="reaction-button" type="button" aria-label={copied ? "Link copied" : "Share"} onClick={share}>
      <Share2 aria-hidden="true" />
      {copied ? <span>Copied</span> : null}
    </button>
  );
}
