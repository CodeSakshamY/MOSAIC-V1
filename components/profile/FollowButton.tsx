import Link from "next/link";
import { toggleFollow } from "@/lib/profile/follow";

export function FollowButton({
  username,
  following,
  signedIn,
  next,
}: {
  username: string;
  following: boolean;
  signedIn: boolean;
  next?: string;
}) {
  const destination = safeNext(next) ?? `/people/${username}`;
  if (!signedIn) {
    return (
      <Link className="text-button follow-button" href={`/profile?next=${encodeURIComponent(destination)}`}>
        Follow
      </Link>
    );
  }
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="username" value={username} />
      {destination.startsWith("/people/") && !next ? null : <input type="hidden" name="next" value={destination} />}
      <button className="text-button follow-button" type="submit" aria-pressed={following}>
        {following ? "Following" : "Follow"}
      </button>
    </form>
  );
}

function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("..")) return null;
  return value.split("?")[0] || null;
}
