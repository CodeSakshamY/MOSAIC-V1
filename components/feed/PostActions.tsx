import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowBigDown, ArrowBigUp, Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { toggleReaction, toggleRepost, toggleSave } from "@/lib/feed/actions";
import type { PostActivity } from "@/lib/feed/activity";
import { ShareButton } from "@/components/feed/ShareButton";

function Count({ value }: { value: number }) {
  if (value < 1) return null;
  return <span>{value}</span>;
}

export function PostActions({
  postId,
  activity,
  signedIn,
}: {
  postId: string;
  activity: PostActivity;
  signedIn: boolean;
}) {
  const login = `/profile?next=${encodeURIComponent(`/posts/${postId}`)}`;
  const vote = (type: "like" | "upvote" | "downvote", label: string, icon: ReactNode) => {
    if (!signedIn) {
      return (
        <Link className="reaction-button" href={login} aria-label={label}>
          {icon}
          <Count value={activity.counts[type]} />
        </Link>
      );
    }
    return (
      <form action={toggleReaction}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="type" value={type} />
        <button className="reaction-button" type="submit" aria-label={label} aria-pressed={activity.mine.has(type)}>
          {icon}
          <Count value={activity.counts[type]} />
        </button>
      </form>
    );
  };

  return (
    <div className="reaction-bar" role="group" aria-label="Post actions">
      {vote("like", "Like", <Heart aria-hidden="true" fill={activity.mine.has("like") ? "currentColor" : "none"} />)}
      {vote("upvote", "Upvote", <ArrowBigUp aria-hidden="true" fill={activity.mine.has("upvote") ? "currentColor" : "none"} />)}
      {vote("downvote", "Downvote", <ArrowBigDown aria-hidden="true" fill={activity.mine.has("downvote") ? "currentColor" : "none"} />)}
      <Link className="reaction-button" href={`/posts/${postId}#comments`} aria-label="Comment">
        <MessageCircle aria-hidden="true" />
        <Count value={activity.counts.comment} />
      </Link>
      {signedIn ? (
        <form action={toggleRepost}>
          <input type="hidden" name="postId" value={postId} />
          <button className="reaction-button" type="submit" aria-label="Repost" aria-pressed={activity.reposted}>
            <Repeat2 aria-hidden="true" />
            <Count value={activity.counts.repost} />
          </button>
        </form>
      ) : (
        <Link className="reaction-button" href={login} aria-label="Repost">
          <Repeat2 aria-hidden="true" />
          <Count value={activity.counts.repost} />
        </Link>
      )}
      <ShareButton path={`/posts/${postId}`} />
      {signedIn ? (
        <form action={toggleSave}>
          <input type="hidden" name="postId" value={postId} />
          <button className="reaction-button" type="submit" aria-label="Save" aria-pressed={activity.saved}>
            <Bookmark aria-hidden="true" fill={activity.saved ? "currentColor" : "none"} />
          </button>
        </form>
      ) : (
        <Link className="reaction-button" href={login} aria-label="Save">
          <Bookmark aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
