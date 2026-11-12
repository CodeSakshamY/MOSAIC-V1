import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function IncomingRequests({ memberId }: { memberId: string }) {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("contribution_requests")
    .select("id, message, project_id, requester_id")
    .eq("status", "pending")
    .neq("requester_id", memberId)
    .limit(8);
  const rows = requests ?? [];
  if (rows.length === 0) return null;
  const projectIds = [...new Set(rows.map((row) => row.project_id))];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug")
    .in("id", projectIds)
    .eq("owner_id", memberId)
    .is("removed_at", null);
  const owned = new Map((projects ?? []).map((project) => [project.id, project]));
  const visible = rows.filter((row) => owned.has(row.project_id));
  if (visible.length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="home-requests-heading">
      <h2 id="home-requests-heading">Collaboration requests</h2>
      <ul className="repo-list" role="list">
        {visible.map((row) => {
          const project = owned.get(row.project_id);
          if (!project) return null;
          return (
            <li key={row.id}>
              <Link href={`/forge/${project.slug}`}>{project.name}</Link>
              <p>{row.message}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
