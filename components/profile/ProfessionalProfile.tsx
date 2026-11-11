import { Children, type ReactNode } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/profile/FollowButton";
import { ReportForm, type reportedState } from "@/components/safety/ReportForm";
import { removeProfileItem } from "@/lib/profile/actions";
import {
  AchievementForm,
  AwardForm,
  CertificateForm,
  EducationForm,
  ExperienceForm,
} from "@/components/profile/RecordForms";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { getMember, memberGate } from "@/lib/auth/session";
import { toggleBlock } from "@/lib/safety/actions";
import { createClient } from "@/lib/supabase/server";

type RecordItem = {
  id: string;
  title: string;
  detail?: string | null;
  meta?: string | null;
  href?: string | null;
  image?: string | null;
};

export async function ProfessionalProfile({
  profileId,
  editable,
  reported = null,
}: {
  profileId: string;
  editable: boolean;
  reported?: ReturnType<typeof reportedState>;
}) {
  const supabase = await createClient();
  const [
    profileResult,
    skillsResult,
    educationResult,
    experienceResult,
    certificateResult,
    awardResult,
    achievementResult,
    ownedResult,
    memberResult,
    mergedResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, bio, avatar_url, banner_url, education, city, state, github_username, website_url")
      .eq("id", profileId)
      .maybeSingle(),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", profileId),
    supabase.from("profile_education").select("id, school, credential, start_year, end_year").eq("profile_id", profileId),
    supabase
      .from("profile_experience")
      .select("id, title, organization, summary, start_year, end_year")
      .eq("profile_id", profileId),
    supabase.from("profile_certificates").select("id, name, issuer, year, credential_url, image_url").eq("profile_id", profileId),
    supabase.from("profile_awards").select("id, title, issuer, year, image_url").eq("profile_id", profileId),
    supabase
      .from("posts")
      .select("id, title, content, media_urls, created_at")
      .eq("author_id", profileId)
      .eq("type", "achievement")
      .is("removed_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, slug, description, tagline, subcategory, category, visibility")
      .eq("owner_id", profileId)
      .is("removed_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("project_id, role")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .neq("role", "owner"),
    supabase
      .from("project_pull_requests")
      .select("id, title, status, target_project_id")
      .eq("author_id", profileId)
      .eq("status", "merged"),
  ]);

  const profile = profileResult.data;
  if (!profile?.username) return null;

  const viewer = await getMember();
  const signedIn = Boolean(viewer && !memberGate(viewer));
  const { data: blockRow } = viewer
    ? await supabase.from("blocks").select("blocked_id").eq("blocker_id", viewer.id).eq("blocked_id", profileId).maybeSingle()
    : { data: null };
  const blocked = Boolean(blockRow);
  const skillIds = (skillsResult.data ?? []).map((row) => row.skill_id);
  const projectIds = (memberResult.data ?? []).map((row) => row.project_id);
  const targetIds = (mergedResult.data ?? []).map((row) => row.target_project_id);
  const [skillRows, contributed, targets, followerCount, followingCount, followerRows, followingRows, mine] =
    await Promise.all([
      skillIds.length
        ? supabase.from("skills").select("id, name").in("id", skillIds)
        : Promise.resolve({ data: [] }),
      projectIds.length
        ? supabase.from("projects").select("id, name, slug, description, tagline, subcategory, category").in("id", projectIds).is("removed_at", null)
        : Promise.resolve({ data: [] }),
      targetIds.length
        ? supabase.from("projects").select("id, name, slug").in("id", targetIds)
        : Promise.resolve({ data: [] }),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", profileId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profileId)
        .order("created_at", { ascending: false })
        .limit(8),
      viewer
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewer.id)
            .eq("following_id", profileId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const relatedIds = [
    ...(followerRows.data ?? []).map((row) => row.follower_id),
    ...(followingRows.data ?? []).map((row) => row.following_id),
  ];
  const { data: relatedProfiles } = relatedIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", relatedIds)
        .is("deleted_at", null)
    : { data: [] };
  const related = new Map(
    (relatedProfiles ?? [])
      .filter((person) => person.username)
      .map((person) => [person.id, { username: person.username as string, displayName: person.display_name }]),
  );
  const followers = (followerRows.data ?? []).flatMap((row) => {
    const person = related.get(row.follower_id);
    return person ? [person] : [];
  });
  const following = (followingRows.data ?? []).flatMap((row) => {
    const person = related.get(row.following_id);
    return person ? [person] : [];
  });

  const place = [profile.city, profile.state].filter(Boolean).join(", ");
  const education = [...(educationResult.data ?? [])].sort(byYears);
  const experience = [...(experienceResult.data ?? [])].sort(byYears);
  const targetName = new Map((targets.data ?? []).map((project) => [project.id, project]));

  const initial = profile.display_name.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="profile-page">
      <header className="profile-header">
        <div className="profile-banner">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="" />
          ) : (
            <div className="profile-banner-empty" />
          )}
        </div>
        {profile.avatar_url ? (
          <img className="profile-avatar" src={profile.avatar_url} alt="" />
        ) : (
          <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
            {initial}
          </span>
        )}
        <h1>{profile.display_name}</h1>
        <p>@{profile.username}</p>
        {profile.education ? <p>{profile.education}</p> : null}
        {place ? <p>{place}</p> : null}
        {profile.github_username || profile.website_url ? (
          <p>
            {profile.github_username ? <span>GitHub {profile.github_username}</span> : null}
            {profile.github_username && profile.website_url ? " · " : null}
            {profile.website_url ? (
              <a href={profile.website_url}>{profile.website_url.replace(/^https:\/\//, "")}</a>
            ) : null}
          </p>
        ) : null}
        <div className="follow-row">
          <p>
            <strong>{followerCount.count ?? 0}</strong> {followerCount.count === 1 ? "follower" : "followers"}
            {" · "}
            <strong>{followingCount.count ?? 0}</strong> following
          </p>
          {viewer?.id === profileId ? null : blocked ? (
            <form action={toggleBlock}>
              <input type="hidden" name="username" value={profile.username} />
              <button className="text-button follow-button" type="submit" aria-pressed="true">
                Unblock
              </button>
            </form>
          ) : (
            <>
              <FollowButton username={profile.username} following={Boolean(mine.data)} signedIn={signedIn} />
              {signedIn ? (
                <form action={toggleBlock}>
                  <input type="hidden" name="username" value={profile.username} />
                  <button className="text-button follow-button" type="submit">
                    Block
                  </button>
                </form>
              ) : null}
            </>
          )}
        </div>
      </header>

      {viewer?.id === profileId ? null : (
        <ReportForm kind="profile" target={profile.username} reported={reported} />
      )}

      <section className="profile-section" aria-labelledby="network-heading">
        <h2 id="network-heading">Network</h2>
        <h3>Followers</h3>
        <PersonLinks people={followers} empty="No followers yet." />
        <h3>Following</h3>
        <PersonLinks people={following} empty="Not following anyone yet." />
      </section>

      {profile.bio || editable ? (
        <section className="profile-section" aria-labelledby="about-heading">
          <h2 id="about-heading">Bio</h2>
          <p>{profile.bio ?? "No bio yet."}</p>
        </section>
      ) : null}

      {editable ? (
        <section className="profile-section" aria-labelledby="edit-profile-heading">
          <h2 id="edit-profile-heading">Edit profile</h2>
          <ProfileEditForm
            displayName={profile.display_name}
            username={profile.username}
            bio={profile.bio}
            city={profile.city}
            state={profile.state}
            github={profile.github_username}
            website={profile.website_url}
          />
        </section>
      ) : null}

      {(skillRows.data ?? []).length > 0 ? (
        <section className="profile-section" aria-labelledby="skills-heading">
          <h2 id="skills-heading">Skills</h2>
          <ul className="skill-row" role="list">
            {(skillRows.data ?? []).map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <RecordSection
        id="experience"
        title="Experience"
        empty="No work added yet."
        editable={editable}
        form={<ExperienceForm />}
        items={experience.map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.organization,
          meta: years(item.start_year, item.end_year),
          body: item.summary,
          kind: "experience",
        }))}
      />

      <RecordSection
        id="education"
        title="Education"
        empty="No education added yet."
        editable={editable}
        form={<EducationForm />}
        items={
          education.length > 0
            ? education.map((item) => ({
                id: item.id,
                title: item.school,
                detail: item.credential,
                meta: years(item.start_year, item.end_year),
                kind: "education",
              }))
            : profile.education
              ? [{ id: "summary", title: profile.education, kind: "summary" }]
              : []
        }
      />

      <RecordSection
        id="certificates"
        title="Certificates"
        empty="No certificates added yet."
        editable={editable}
        form={<CertificateForm />}
        items={(certificateResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.name,
          detail: item.issuer,
          meta: item.year ? String(item.year) : null,
          href: item.credential_url,
          image: item.image_url,
          kind: "certificate",
        }))}
      />

      <RecordSection
        id="awards"
        title="Awards"
        empty="No awards added yet."
        editable={editable}
        form={<AwardForm />}
        items={(awardResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.issuer,
          meta: item.year ? String(item.year) : null,
          image: item.image_url,
          kind: "award",
        }))}
      />

      <RecordSection
        id="achievements"
        title="Achievements"
        empty="No achievements added yet."
        editable={editable}
        form={<AchievementForm />}
        items={(achievementResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.title ?? "Achievement",
          body: item.content,
          image: item.media_urls[0] ?? null,
          kind: "achievement",
        }))}
      />

      <section className="profile-section" aria-labelledby="projects-heading">
        <h2 id="projects-heading">Projects</h2>
        <ProjectGroup title="Repositories" empty="No public projects yet.">
          {(ownedResult.data ?? []).map((project) => (
            <li key={project.id} className="repo-row">
              <div className="repo-title">
                <Link href={`/forge/${project.slug}`}>{project.name}</Link>
                <span className="repo-visibility">{project.visibility === "private" ? "Private" : "Public"}</span>
                <span className="repo-visibility">{project.category}</span>
                {project.subcategory ? <span className="repo-visibility">{project.subcategory}</span> : null}
              </div>
              {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
              <p>{project.description}</p>
            </li>
          ))}
        </ProjectGroup>
        <ProjectGroup title="Contributions" empty="No contributions yet.">
          {(contributed.data ?? []).map((project) => (
            <li key={project.id} className="repo-row">
              <Link href={`/forge/${project.slug}`}>{project.name}</Link>
              {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
              <p>{project.description}</p>
            </li>
          ))}
        </ProjectGroup>
        <ProjectGroup title="Merged pull requests" empty="No merged pull requests yet.">
          {(mergedResult.data ?? []).map((request) => {
            const target = targetName.get(request.target_project_id);
            return (
              <li key={request.id} className="repo-row">
                <strong>{request.title}</strong>
                {target ? (
                  <p>
                    Merged into <Link href={`/forge/${target.slug}`}>{target.name}</Link>
                  </p>
                ) : (
                  <p>Merged</p>
                )}
              </li>
            );
          })}
        </ProjectGroup>
      </section>
    </article>
  );
}

function RecordSection({
  id,
  title,
  empty,
  items,
  editable,
  form,
}: {
  id: string;
  title: string;
  empty: string;
  items: Array<RecordItem & { body?: string | null; kind: string }>;
  editable: boolean;
  form: ReactNode;
}) {
  return (
    <section className="profile-section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {items.length === 0 ? <p>{empty}</p> : null}
      {items.map((item) => (
        <article key={item.id} className="profile-entry">
          <h3>{item.href ? <a href={item.href}>{item.title}</a> : item.title}</h3>
          {item.detail ? <p>{item.detail}</p> : null}
          {item.meta ? <p className="profile-meta">{item.meta}</p> : null}
          {item.body ? <p>{item.body}</p> : null}
          {item.image ? (
            <img className="record-photo" src={item.image} alt={item.title} />
          ) : null}
          {editable && item.kind !== "summary" && item.kind !== "achievement" ? (
            <form action={removeProfileItem}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="kind" value={item.kind} />
              <button className="text-button" type="submit">
                Remove
              </button>
            </form>
          ) : null}
        </article>
      ))}
      {editable ? form : null}
    </section>
  );
}

function ProjectGroup({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const filled = Children.count(children) > 0;
  return (
    <div className="profile-entry">
      <h3>{title}</h3>
      {filled ? <ul className="repo-list" role="list">{children}</ul> : <p>{empty}</p>}
    </div>
  );
}

function PersonLinks({
  people,
  empty,
}: {
  people: { username: string; displayName: string }[];
  empty: string;
}) {
  if (people.length === 0) return <p>{empty}</p>;
  return (
    <ul className="person-links" role="list">
      {people.map((person) => (
        <li key={person.username}>
          <Link href={`/people/${person.username}`}>{person.displayName}</Link>
        </li>
      ))}
    </ul>
  );
}

function years(start: number | null, end: number | null) {
  if (!start && !end) return null;
  if (start && !end) return `${start} – present`;
  if (!start && end) return String(end);
  return `${start} – ${end}`;
}

function byYears<T extends { start_year: number | null; end_year: number | null }>(left: T, right: T) {
  const leftKey = left.end_year ?? 9999;
  const rightKey = right.end_year ?? 9999;
  return rightKey - leftKey;
}
