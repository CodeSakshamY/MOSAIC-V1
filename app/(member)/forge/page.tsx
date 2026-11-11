import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewProjectForm } from "@/components/build/NewProjectForm";
import { FilterMenu } from "@/components/filters/FilterMenu";
import { getMember } from "@/lib/auth/session";
import { isProjectCategory, projectCategories, projectStatusLabel } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Forge",
};

export default function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; visibility?: string; type?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <BuildWorkspace searchParams={searchParams} />
    </Suspense>
  );
}

async function BuildWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; visibility?: string; type?: string }>;
}) {
  const params = await searchParams;
  const member = await getMember();
  const query = (params.q ?? "").trim().slice(0, 80).replace(/[%_\\]/g, "");
  const visibility = params.visibility === "public" || params.visibility === "private" ? params.visibility : "all";
  const type = params.type && isProjectCategory(params.type) ? params.type : "all";
  const supabase = await createClient();
  let request = supabase
    .from("projects")
    .select("name, slug, description, visibility, status, category, updated_at")
    .eq("owner_id", member?.id ?? "")
    .is("removed_at", null)
    .order("updated_at", { ascending: false });
  if (visibility !== "all") request = request.eq("visibility", visibility);
  if (type !== "all") request = request.eq("category", type);
  if (query) {
    request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }
  const { data } = await request;
  const projects = data ?? [];
  const username = member?.username ?? "you";

  return (
    <div className="build-page">
      <header className="page-header">
        <h1>Forge</h1>
        <p className="lede">Your projects live here, listed the way repositories are. Create one, then open it.</p>
      </header>
      <div className="build-layout">
        <section aria-labelledby="your-projects">
          <div className="repo-toolbar">
            <h2 id="your-projects">Your projects</h2>
            <form className="repo-search" action="/forge">
              <label className="sr-only" htmlFor="project-search">
                Find a project
              </label>
              <input
                id="project-search"
                name="q"
                defaultValue={query}
                placeholder="Find a project"
                className="repo-search-input"
              />
              {visibility !== "all" ? <input type="hidden" name="visibility" value={visibility} /> : null}
              {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
            </form>
            <nav className="repo-filters" aria-label="Project visibility">
              <FilterLink href={filterHref(query, "all", type)} current={visibility === "all"}>
                All
              </FilterLink>
              <FilterLink href={filterHref(query, "public", type)} current={visibility === "public"}>
                Public
              </FilterLink>
              <FilterLink href={filterHref(query, "private", type)} current={visibility === "private"}>
                Private
              </FilterLink>
            </nav>
          </div>
          <FilterMenu active={type === "all" ? 0 : 1}>
            <nav className="repo-filters type-filters" aria-label="Project type">
              <FilterLink href={filterHref(query, visibility, "all")} current={type === "all"}>
                All types
              </FilterLink>
              {projectCategories.map((category) => (
                <FilterLink
                  key={category}
                  href={filterHref(query, visibility, category)}
                  current={type === category}
                >
                  {category}
                </FilterLink>
              ))}
            </nav>
          </FilterMenu>
          {projects.length === 0 ? (
            <p className="repo-empty">
              {query || visibility !== "all" || type !== "all"
                ? "No projects match that filter."
                : "You have no projects yet. Create one in the panel beside this list."}
            </p>
          ) : (
            <ul className="repo-list" role="list">
              {projects.map((project) => (
                <li key={project.slug} className="repo-row">
                  <div className="repo-title">
                    <Link href={`/forge/${project.slug}`}>
                      <span className="repo-owner">{username}</span>
                      <span aria-hidden="true"> / </span>
                      <span className="repo-name">{project.name}</span>
                    </Link>
                    <span className="repo-visibility">{project.visibility === "private" ? "Private" : "Public"}</span>
                    <span className="repo-visibility">{project.category}</span>
                  </div>
                  <p>{project.description}</p>
                  <p className="repo-meta">
                    <span className="repo-status">{projectStatusLabel(project.status)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Updated{" "}
                      {new Date(project.updated_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="new-project" aria-labelledby="new-project">
          <h2 id="new-project">Create a new project</h2>
          <p className="form-note">A name, a short description, and who can read it. That is enough to start.</p>
          <NewProjectForm username={username} />
        </aside>
      </div>
    </div>
  );
}

function filterHref(query: string, visibility: string, type: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (visibility !== "all") params.set("visibility", visibility);
  if (type !== "all") params.set("type", type);
  const suffix = params.toString();
  return suffix ? `/forge?${suffix}` : "/forge";
}

function FilterLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: string;
}) {
  return (
    <Link href={href} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
