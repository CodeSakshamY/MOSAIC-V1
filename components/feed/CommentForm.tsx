import { addComment } from "@/lib/feed/actions";

export function CommentForm({ postId, parentId }: { postId: string; parentId?: string }) {
  return (
    <form className="comment-form" action={addComment}>
      <input type="hidden" name="postId" value={postId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea name="content" required maxLength={2000} rows={2} aria-label={parentId ? "Reply" : "Comment"} />
      <button className="reaction-button" type="submit">
        {parentId ? "Reply" : "Comment"}
      </button>
    </form>
  );
}
