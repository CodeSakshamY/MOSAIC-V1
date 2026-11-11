import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewProjectForm } from "@/components/build/NewProjectForm";
import { FilterMenu } from "@/components/filters/FilterMenu";
import { getMember } from "@/lib/auth/session";
import { isProjectCategory, isProjectSubcategory, projectCategories, projectStatusLabel, projectSubcategories } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Forge",
};

export default function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; visibility?: string; type?: string; sub?: string; tool?: string }>;
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
  searchParams: Promise<{ q?: string; visibility?: string; type?: string; sub?: string; tool?: string }>;
}) {
  const params = await searchParams;
  const member = await getMember();
  const query = (params.q ?? "").trim().slice(0, 80).replace(/[%_\\]/g, "");
  const visibility = params.visibility === "public" || params.visibility === "private" ? params.visibility : "all";
  const type = params.type && isProjectCategory(params.type) ? params.type : "all";
  const subcategory = type !== "all" && params.sub && isProjectSubcategory(type, params.sub) ? params.sub : "";
  const supabase = await createClient();
  const { data: skillRows } = await supabase.from("skills").select("id, name, slug").order("name");
  const skills = skillRows ?? [];
  const tool = skills.find((skill) => skill.slug === params.tool)?.slug ?? "";
  let request = supabase
    .from("projects")
    .select("id, name, slug, description, tagline, subcategory, visibility, status, category, updated_at")
    .eq("owner_id", member?.id ?? "")
    .is("removed_at", null)
    .order("updated_at", { ascending: false });
  if (visibility !== "all") request = request.eq("visibility", visibility);
  if (type !== "all") request = request.eq("category", type);
  if (subcategory) request = request.eq("subcategory", subcategory);
  if (query) {
    request = request.or(`name.ilike.%${query}%,description.ilike.%${query}%,tagline.ilike.%${query}%`);
  }
  const { data } = await request;
  const owned = data ?? [];
  const { data: usedRows } = owned.length
    ? await supabase.from("project_skills").select("project_id, skill_id").eq("relation", "uses").in(
        "project_id",
        owned.map((project) => project.id),
      )
    : { data: [] };
  const names = new Map(skills.map((skill) => [skill.id, skill.name]));
  const toolsByProject = new Map<string, string[]>();
  for (const row of usedRows ?? []) {
    const name = names.get(row.skill_id);
    if (!name) continue;
    const list = toolsByProject.get(row.project_id) ?? [];
    list.push(name);
    toolsByProject.set(row.project_id, list);
  }
  const toolName = skills.find((skill) => skill.slug === tool)?.name;
  const projects = toolName
    ? owned.filter((project) => (toolsByProject.get(project.id) ?? []).includes(toolName))
    : owned;
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
              {subcategory ? <input type="hidden" name="sub" value={subcategory} /> : null}
              {tool ? <input type="hidden" name="tool" value={tool} /> : null}
            </form>
            <nav className="repo-filters" aria-label="Project visibility">
              <FilterLink href={filterHref(query, "all", type, subcategory, tool)} current={visibility === "all"}>
                All
              </FilterLink>
              <FilterLink href={filterHref(query, "public", type, subcategory, tool)} current={visibility === "public"}>
                Public
              </FilterLink>
              <FilterLink href={filterHref(query, "private", type, subcategory, tool)} current={visibility === "private"}>
                Private
              </FilterLink>
            </nav>
          </div>
          <FilterMenu active={(type === "all" ? 0 : 1) + (subcategory ? 1 : 0) + (tool ? 1 : 0)}>
            <nav className="repo-filters type-filters" aria-label="Project type">
              <FilterLink href={filterHref(query, visibility, "all", "", tool)} current={type === "all"}>
                All types
              </FilterLink>
              {projectCategories.map((category) => (
                <FilterLink
                  key={category}
                  href={filterHref(query, visibility, category, "", tool)}
                  current={type === category}
                >
                  {category}
                </FilterLink>
              ))}
            </nav>
            {type !== "all" ? (
              <nav className="repo-filters type-filters" aria-label="Subcategory">
                <FilterLink href={filterHref(query, visibility, type, "", tool)} current={!subcategory}>
                  All subcategories
                </FilterLink>
                {projectSubcategories[type].map((item) => (
                  <FilterLink
                    key={item}
                    href={filterHref(query, visibility, type, item, tool)}
                    current={subcategory === item}
                  >
                    {item}
                  </FilterLink>
                ))}
              </nav>
            ) : null}
            <form className="field" action="/forge">
              {query ? <input type="hidden" name="q" value={query} /> : null}
              {visibility !== "all" ? <input type="hidden" name="visibility" value={visibility} /> : null}
              {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
              {subcategory ? <input type="hidden" name="sub" value={subcategory} /> : null}
              <label htmlFor="forge-tool">Tool</label>
              <select id="forge-tool" name="tool" className="field-select" defaultValue={tool}>
                <option value="">Any tool</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.slug}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <button className="text-button" type="submit">
                Apply tool
              </button>
            </form>
          </FilterMenu>
          {projects.length === 0 ? (
            <p className="repo-empty">
              {query || visibility !== "all" || type !== "all" || tool
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
                    {project.subcategory ? <span className="repo-visibility">{project.subcategory}</span> : null}
                    {(toolsByProject.get(project.id) ?? []).map((name) => (
                      <span key={name} className="repo-visibility">
                        {name}
                      </span>
                    ))}
                  </div>
                  {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
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

function filterHref(query: string, visibility: string, type: string, subcategory = "", tool = "") {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (visibility !== "all") params.set("visibility", visibility);
  if (type !== "all") params.set("type", type);
  if (subcategory) params.set("sub", subcategory);
  if (tool) params.set("tool", tool);
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
