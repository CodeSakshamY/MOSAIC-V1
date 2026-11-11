import { hidePost, unhidePost } from "@/lib/safety/actions";

export function HidePostButton({ postId, hidden }: { postId: string; hidden: boolean }) {
  return (
    <form action={hidden ? unhidePost : hidePost}>
      <input type="hidden" name="postId" value={postId} />
      <button className="text-button" type="submit">
        {hidden ? "Unhide" : "Hide"}
      </button>
    </form>
  );
}
