import Link from "next/link";
import { toggleProjectFollow } from "@/lib/projects/follow";

export function ProjectFollowButton({
  projectId,
  following,
  signedIn,
  next,
}: {
  projectId: string;
  following: boolean;
  signedIn: boolean;
  next: string;
}) {
  const destination = safeNext(next) ?? "/discover";
  if (!signedIn) {
    return (
      <Link className="text-button follow-button" href={`/profile?next=${encodeURIComponent(destination)}`}>
        Follow project
      </Link>
    );
  }
  return (
    <form action={toggleProjectFollow}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="next" value={destination} />
      <button className="text-button follow-button" type="submit" aria-pressed={following}>
        {following ? "Following project" : "Follow project"}
      </button>
    </form>
  );
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("..")) return null;
  return value.split("?")[0] || null;
}
