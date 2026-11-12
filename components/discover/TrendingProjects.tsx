import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function TrendingProjects() {
  const supabase = await createClient();
  const { data: reactions } = await supabase
    .from("reactions")
    .select("post_id, created_at")
    .order("created_at", { ascending: false })
    .limit(80);
  const postIds = [...new Set((reactions ?? []).map((row) => row.post_id))];
  if (postIds.length === 0) return null;
  const { data: posts } = await supabase.from("posts").select("id, project_id").in("id", postIds).not("project_id", "is", null);
  const projectByPost = new Map((posts ?? []).map((post) => [post.id, post.project_id]));
  const projectIds: string[] = [];
  for (const reaction of reactions ?? []) {
    const projectId = projectByPost.get(reaction.post_id);
    if (!projectId || projectIds.includes(projectId)) continue;
    projectIds.push(projectId);
    if (projectIds.length === 8) break;
  }
  if (projectIds.length === 0) return null;
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug")
    .in("id", projectIds)
    .eq("visibility", "public")
    .is("removed_at", null);
  const byId = new Map((projects ?? []).map((project) => [project.id, project]));
  const ordered = projectIds.map((id) => byId.get(id)).filter((project) => project != null);
  if (ordered.length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="trending-heading">
      <h2 id="trending-heading">Trending</h2>
      <p className="form-note">Public projects whose updates were reacted to most recently.</p>
      <ul className="skill-row" role="list">
        {ordered.map((project) => (
          <li key={project.id}>
            <Link href={`/forge/${project.slug}`}>{project.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
