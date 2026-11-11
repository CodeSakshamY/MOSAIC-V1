import Link from "next/link";
import { tuneFeed } from "@/lib/feed/actions";
import type { HomeItem } from "@/lib/feed/home";

export function HomeCard({ item, dismiss }: { item: HomeItem; dismiss: boolean }) {
  return (
    <li className="repo-row">
      <div className="repo-title">
        <strong>
          <Link href={item.href}>{item.title}</Link>
        </strong>
        <span className="repo-visibility">{item.label}</span>
      </div>
      {item.reason ? <p className="feed-reason">{item.reason}</p> : null}
      <p className="discover-copy">{item.content}</p>
      <p className="profile-meta">
        {item.authorUsername ? (
          <Link href={`/people/${item.authorUsername}`}>{item.authorName}</Link>
        ) : (
          item.authorName
        )}
        {item.projectSlug ? (
          <>
            {" · "}
            <Link href={`/forge/${item.projectSlug}`}>{item.projectName}</Link>
          </>
        ) : null}
      </p>
      {dismiss ? (
        <div className="author-row">
          <form action={tuneFeed}>
            <input type="hidden" name="postId" value={item.id} />
            <input type="hidden" name="signal" value="more" />
            <button className="text-button" type="submit" aria-pressed={item.preference === "more"}>
              Show more
            </button>
          </form>
          <form action={tuneFeed}>
            <input type="hidden" name="postId" value={item.id} />
            <input type="hidden" name="signal" value="less" />
            <button className="text-button" type="submit" aria-pressed={item.preference === "less"}>
              Show less
            </button>
          </form>
          <form action={tuneFeed}>
            <input type="hidden" name="postId" value={item.id} />
            <input type="hidden" name="signal" value="dismiss" />
            <button className="text-button" type="submit">
              Not interested
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
