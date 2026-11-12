import type { Metadata } from "next";
import Link from "next/link";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { dismissReport, removeReported, restoreSanction, suspendReported } from "@/lib/moderation/actions";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = { title: "Moderation" };

export default async function ModerationPage() {
  await getMember();
  const supabase = await createClient();
  const { data: staff } = await supabase.rpc("current_user_is_staff");
  if (!staff) {
    return (
      <SectionPage title="Moderation" lede="This page is for staff.">
        <p>This page is for staff.</p>
      </SectionPage>
    );
  }
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, description, post_id, project_id, comment_id, opportunity_id, profile_id, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = reports ?? [];
  const postIds = rows.flatMap((row) => (row.post_id ? [row.post_id] : []));
  const { data: posts } = postIds.length
    ? await supabase.from("posts").select("id, title, author_id").in("id", postIds)
    : { data: [] };
  const postById = new Map((posts ?? []).map((post) => [post.id, post]));
  const { data: sanctions } = await supabase
    .from("account_sanctions")
    .select("id, profile_id, reason, created_at")
    .is("lifted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <SectionPage title="Moderation" lede="Open reports can be dismissed or removed. A suspension can be recorded from a reported post.">
      <section aria-labelledby="report-queue-heading">
        <h2 id="report-queue-heading">Open reports</h2>
        {rows.length === 0 ? <p>No open reports.</p> : null}
        <ul className="repo-list" role="list">
          {rows.map((report) => {
            const post = report.post_id ? postById.get(report.post_id) : undefined;
            return (
              <li key={report.id} className="repo-row">
                <p>
                  <strong>{report.reason}</strong>
                  {post?.title ? ` · ${post.title}` : ""}
                </p>
                {report.description ? <p>{report.description}</p> : null}
                <form action={dismissReport}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <button className="text-button" type="submit">
                    Dismiss
                  </button>
                </form>
                <form action={removeReported}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <button className="text-button" type="submit">
                    Remove
                  </button>
                </form>
                {post ? (
                  <form action={suspendReported}>
                    <input type="hidden" name="profileId" value={post.author_id} />
                    <button className="text-button" type="submit">
                      Suspend author
                    </button>
                  </form>
                ) : null}
                {post ? <Link href={`/posts/${post.id}`}>Open post</Link> : null}
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="sanctions-heading">
        <h2 id="sanctions-heading">Suspensions</h2>
        {(sanctions ?? []).length === 0 ? <p>No current suspensions.</p> : null}
        <ul className="repo-list" role="list">
          {(sanctions ?? []).map((sanction) => (
            <li key={sanction.id} className="repo-row">
              {sanction.reason}
              <form action={restoreSanction}>
                <input type="hidden" name="sanctionId" value={sanction.id} />
                <button className="text-button" type="submit">
                  Restore
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </SectionPage>
  );
}
