import Link from "next/link";
import { toggleFollow } from "@/lib/profile/follow";

export function FollowButton({
  username,
  following,
  signedIn,
}: {
  username: string;
  following: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <Link className="text-button follow-button" href={`/profile?next=${encodeURIComponent(`/people/${username}`)}`}>
        Follow
      </Link>
    );
  }
  return (
    <form action={toggleFollow}>
      <input type="hidden" name="username" value={username} />
      <button className="text-button follow-button" type="submit" aria-pressed={following}>
        {following ? "Following" : "Follow"}
      </button>
    </form>
  );
}
