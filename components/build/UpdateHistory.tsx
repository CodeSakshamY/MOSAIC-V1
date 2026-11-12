import { ArrowBigDown, ArrowBigUp, Heart } from "lucide-react";
import { commentOnUpdate, reactToUpdate } from "@/lib/projects/actions";
import { buildLogKindLabel } from "@/lib/projects/log-kind";
import { LogMedia } from "@/components/build/LogMedia";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const reactionLabels = { like: "Like", upvote: "Upvote", downvote: "Downvote" } as const;

export function UpdateHistory({
  slug,
  signedIn,
  updates,
}: {
  slug: string;
  signedIn: boolean;
  updates: {
    id: string;
    title: string;
    content: string;
    when: string;
    author: string;
    media: string[];
    kind: string;
    postId: string | null;
    reactions: { type: "like" | "upvote" | "downvote"; count: number; pressed: boolean }[];
    comments: { id: string; author: string; content: string }[];
  }[];
}) {
  return (
    <section className="project-updates" aria-labelledby="project-updates-heading">
      <h2 id="project-updates-heading">Updates</h2>
      <p className="form-note">Build logs on this project, newest first. New ones are written from Commits.</p>
      {updates.length === 0 ? <p className="repo-empty">No updates yet.</p> : null}
      <ol className="repo-list">
        {updates.map((update) => (
          <li key={update.id}>
            <strong>{update.title}</strong>
            {update.kind !== "update" ? <span className="repo-visibility">{buildLogKindLabel(update.kind)}</span> : null}
            <p>{update.content}</p>
            <LogMedia urls={update.media} title={update.title} />
            <p className="repo-meta">
              {update.author}
              <span aria-hidden="true">·</span>
              {update.when}
            </p>
            {update.postId ? (
              <div className="reaction-bar" role="group" aria-label="Update reactions">
                {update.reactions.map((reaction) => {
                  const icon =
                    reaction.type === "like" ? (
                      <Heart aria-hidden="true" fill={reaction.pressed ? "currentColor" : "none"} />
                    ) : reaction.type === "upvote" ? (
                      <ArrowBigUp aria-hidden="true" fill={reaction.pressed ? "currentColor" : "none"} />
                    ) : (
                      <ArrowBigDown aria-hidden="true" fill={reaction.pressed ? "currentColor" : "none"} />
                    );
                  if (!signedIn) {
                    return (
                      <span key={reaction.type} className="reaction-button" aria-label={reactionLabels[reaction.type]}>
                        {icon}
                        {reaction.count > 0 ? <span>{reaction.count}</span> : null}
                      </span>
                    );
                  }
                  return (
                    <form key={reaction.type} action={reactToUpdate}>
                      <input type="hidden" name="postId" value={update.postId ?? ""} />
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="type" value={reaction.type} />
                      <button className="reaction-button" type="submit" aria-label={reactionLabels[reaction.type]} aria-pressed={reaction.pressed}>
                        {icon}
                        {reaction.count > 0 ? <span>{reaction.count}</span> : null}
                      </button>
                    </form>
                  );
                })}
              </div>
            ) : null}
            {update.comments.length ? (
              <ul className="repo-list">
                {update.comments.map((comment) => (
                  <li key={comment.id}>
                    <p>{comment.content}</p>
                    <p className="repo-meta">{comment.author}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {update.postId ? (
              <form className="form-stack" action={commentOnUpdate}>
                <input type="hidden" name="postId" value={update.postId} />
                <input type="hidden" name="slug" value={slug} />
                <div className="field">
                  <Label htmlFor={`update-comment-${update.id}`}>Comment</Label>
                  <Textarea id={`update-comment-${update.id}`} name="content" required maxLength={2000} rows={2} />
                </div>
                <button className="text-button" type="submit">
                  Comment
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
