import { Children, type ReactNode } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/profile/FollowButton";
import { ReportForm, type reportedState } from "@/components/safety/ReportForm";
import { removeProfileItem, featureProject, saveProfileVisibility } from "@/lib/profile/actions";
import {
  AchievementForm,
  AwardForm,
  CertificateForm,
  CommunityForm,
  CompetitionForm,
  EducationForm,
  ExperienceForm,
  PublicationForm,
} from "@/components/profile/RecordForms";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { CollaborationForm } from "@/components/profile/CollaborationForm";
import { InterestsForm } from "@/components/profile/InterestsForm";
import { ProfileSectionForm } from "@/components/profile/ProfileSectionForm";
import { ProfileLinkForm } from "@/components/profile/ProfileLinkForm";
import { LookingForForm } from "@/components/profile/LookingForForm";
import { collaborationLabel } from "@/lib/profile/collaboration";
import { lookingForOptions } from "@/lib/auth/looking-for";
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
  verified?: boolean;
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
    interestsResult,
    educationResult,
    experienceResult,
    certificateResult,
    awardResult,
    achievementResult,
    ownedResult,
    memberResult,
    mergedResult,
    publicationResult,
    competitionResult,
    communityResult,
    linkResult,
    buildLogResult,
    sectionResult,
  ] = await Promise.all([
    supabase
      .from("profile_directory")
      .select("username, display_name, bio, avatar_url, banner_url, education, city, state, github_username, website_url, collaboration_preference, looking_for, visibility")
      .eq("id", profileId)
      .maybeSingle(),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", profileId),
    supabase.from("profile_interests").select("interest_id").eq("profile_id", profileId),
    supabase.from("profile_education").select("id, school, credential, start_year, end_year").eq("profile_id", profileId),
    supabase
      .from("profile_experience")
      .select("id, title, organization, summary, start_year, end_year")
      .eq("profile_id", profileId),
    supabase.from("profile_certificates").select("id, name, issuer, year, credential_url, image_url, verified_at").eq("profile_id", profileId),
    supabase.from("profile_awards").select("id, title, issuer, year, image_url, verified_at").eq("profile_id", profileId),
    supabase
      .from("posts")
      .select("id, title, content, media_urls, created_at")
      .eq("author_id", profileId)
      .eq("type", "achievement")
      .is("removed_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, slug, description, tagline, subcategory, category, visibility, status, profile_featured_at, created_at")
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
    supabase
      .from("profile_publications")
      .select("id, title, venue, year, url, summary, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_competitions")
      .select("id, name, host, year, result, url, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_communities")
      .select("id, name, role, year, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
    supabase.from("profile_links").select("id, label, url").eq("profile_id", profileId).order("created_at", { ascending: true }),
    supabase
      .from("build_logs")
      .select("id, title, created_at, project_id")
      .eq("author_id", profileId)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("profile_sections")
      .select("id, title, body")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileResult.data;
  if (!profile?.username) return null;

  const viewer = await getMember();
  const signedIn = Boolean(viewer && !memberGate(viewer));
  const { data: blockRow } = viewer
    ? await supabase.from("blocks").select("blocked_id").eq("blocker_id", viewer.id).eq("blocked_id", profileId).maybeSingle()
    : { data: null };
  const blocked = Boolean(blockRow);
  const savedRows =
    editable && viewer?.id === profileId
      ? (
          await supabase
            .from("project_saves")
            .select("project_id")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: false })
        ).data ?? []
      : [];
  const savedIds = savedRows.map((row) => row.project_id);
  const skillIds = (skillsResult.data ?? []).map((row) => row.skill_id);
  const interestIds = (interestsResult.data ?? []).map((row) => row.interest_id);
  const projectIds = (memberResult.data ?? []).map((row) => row.project_id);
  const targetIds = (mergedResult.data ?? []).map((row) => row.target_project_id);
  const [skillRows, interestRows, interestCatalog, contributed, targets, savedProjects, followerCount, followingCount, followerRows, followingRows, mine] =
    await Promise.all([
      skillIds.length
        ? supabase.from("skills").select("id, name").in("id", skillIds)
        : Promise.resolve({ data: [] }),
      interestIds.length
        ? supabase.from("interests").select("id, name").in("id", interestIds)
        : Promise.resolve({ data: [] }),
      editable
        ? supabase.from("interests").select("id, name").order("name")
        : Promise.resolve({ data: [] }),
      projectIds.length
        ? supabase.from("projects").select("id, name, slug, description, tagline, subcategory, category").in("id", projectIds).is("removed_at", null)
        : Promise.resolve({ data: [] }),
      targetIds.length
        ? supabase.from("projects").select("id, name, slug").in("id", targetIds)
        : Promise.resolve({ data: [] }),
      savedIds.length
        ? supabase.from("projects").select("id, name, slug").in("id", savedIds).is("removed_at", null)
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
        .from("profile_directory")
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
  const owned = ownedResult.data ?? [];
  const featured = owned
    .filter((project) => project.visibility === "public" && project.profile_featured_at)
    .sort((left, right) => (right.profile_featured_at ?? "").localeCompare(left.profile_featured_at ?? ""));
  const completed = owned.filter((project) => project.status === "completed");
  const current = owned.filter((project) => project.status !== "completed");
  const profileParts = [
    { label: "Username", done: Boolean(profile.username) },
    { label: "Name", done: profile.display_name.trim().length > 0 },
    { label: "Photo", done: Boolean(profile.avatar_url) },
    { label: "Bio", done: Boolean(profile.bio?.trim()) },
    { label: "City", done: Boolean(profile.city?.trim()) },
    { label: "Skills", done: (skillRows.data ?? []).length > 0 },
    { label: "Interests", done: (interestsResult.data ?? []).length > 0 },
    { label: "Looking for", done: profile.looking_for.length > 0 },
    { label: "Project or education", done: owned.length > 0 || education.length > 0 },
  ];
  const profileDone = profileParts.filter((part) => part.done).length;
  const profileOpen = profileParts.filter((part) => !part.done).map((part) => part.label);
  const activity: Array<{ id: string; at: string; text: string; href?: string }> = [
    ...owned.map((project) => ({
      id: `project-${project.id}`,
      at: project.created_at,
      text: `Started ${project.name}`,
      href: project.visibility === "public" || editable ? `/forge/${project.slug}` : undefined,
    })),
    ...(buildLogResult.data ?? []).map((log) => {
      const project = owned.find((item) => item.id === log.project_id);
      return {
        id: `log-${log.id}`,
        at: log.created_at,
        text: project ? `Update on ${project.name}: ${log.title}` : `Update: ${log.title}`,
        href: project && (project.visibility === "public" || editable) ? `/forge/${project.slug}` : undefined,
      };
    }),
    ...(achievementResult.data ?? []).map((post) => ({
      id: `achievement-${post.id}`,
      at: post.created_at,
      text: `Achievement: ${post.title?.trim() || post.content.slice(0, 80)}`,
    })),
    ...(publicationResult.data ?? []).map((item) => ({
      id: `publication-${item.id}`,
      at: item.created_at,
      text: `Research: ${item.title}`,
    })),
    ...(competitionResult.data ?? []).map((item) => ({
      id: `competition-${item.id}`,
      at: item.created_at,
      text: `Competition: ${item.name}`,
    })),
    ...(communityResult.data ?? []).map((item) => ({
      id: `community-${item.id}`,
      at: item.created_at,
      text: `Community: ${item.name}`,
    })),
  ]
    .sort((left, right) => right.at.localeCompare(left.at))
    .slice(0, 30);

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
        {profile.github_username || profile.website_url || (linkResult.data ?? []).length > 0 ? (
          <p>
            {profile.github_username ? <span>GitHub {profile.github_username}</span> : null}
            {profile.github_username && profile.website_url ? " · " : null}
            {profile.website_url ? (
              <a href={profile.website_url}>{profile.website_url.replace(/^https:\/\//, "")}</a>
            ) : null}
            {(linkResult.data ?? []).map((link) => (
              <a key={link.id} href={link.url}>
                {link.label}
              </a>
            ))}
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

      <section className="profile-section" aria-labelledby="completion-heading">
        <h2 id="completion-heading">Profile details</h2>
        <p>
          {profileDone} of {profileParts.length}
        </p>
        {profileOpen.length > 0 ? <p>Still open: {profileOpen.join(", ")}.</p> : <p>Every part is filled in.</p>}
      </section>

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
          <form className="form-stack" action={saveProfileVisibility}>
            <div className="field">
              <label htmlFor="profile-visibility">Who can see this profile</label>
              <select id="profile-visibility" name="visibility" defaultValue={profile.visibility}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <p className="form-note">A private profile shows your name and username. Public projects and posts stay at their own addresses.</p>
            <button className="text-button" type="submit">
              Save visibility
            </button>
          </form>
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

      {(interestRows.data ?? []).length > 0 || editable ? (
        <section className="profile-section" aria-labelledby="interests-heading">
          <h2 id="interests-heading">Interests</h2>
          {(interestRows.data ?? []).length > 0 ? (
            <ul className="skill-row" role="list">
              {(interestRows.data ?? [])
                .slice()
                .sort((left, right) => left.name.localeCompare(right.name))
                .map((interest) => (
                  <li key={interest.id}>{interest.name}</li>
                ))}
            </ul>
          ) : (
            <p className="form-note">No interests yet.</p>
          )}
          {editable ? (
            <InterestsForm
              options={interestCatalog.data ?? []}
              selected={interestIds}
            />
          ) : null}
        </section>
      ) : null}

      {profile.collaboration_preference || editable ? (
        <section className="profile-section" aria-labelledby="collaboration-heading">
          <h2 id="collaboration-heading">Collaboration</h2>
          <p>{collaborationLabel(profile.collaboration_preference) ?? "No collaboration preference yet."}</p>
          {editable ? <CollaborationForm value={profile.collaboration_preference} /> : null}
        </section>
      ) : null}

      {(profile.looking_for.length > 0 || editable) ? (
        <section className="profile-section" aria-labelledby="looking-for-heading">
          <h2 id="looking-for-heading">Looking for</h2>
          {profile.looking_for.length > 0 ? (
            <ul className="skill-row" role="list">
              {lookingForOptions
                .filter((option) => profile.looking_for.includes(option.value))
                .map((option) => (
                  <li key={option.value}>{option.label}</li>
                ))}
            </ul>
          ) : (
            <p className="form-note">No looking-for status yet.</p>
          )}
          {editable ? <LookingForForm selected={profile.looking_for} /> : null}
        </section>
      ) : null}

      <section className="profile-section" aria-labelledby="activity-heading">
        <h2 id="activity-heading">Activity</h2>
        {activity.length > 0 ? (
          <ol className="activity-list">
            {activity.map((event) => (
              <li key={event.id}>
                <time dateTime={event.at}>{event.at.slice(0, 10)}</time>
                {event.href ? <a href={event.href}>{event.text}</a> : <span>{event.text}</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="form-note">No activity yet.</p>
        )}
      </section>

      <RecordSection
        id="links"
        title="Links"
        empty="No extra links yet."
        editable={editable}
        form={<ProfileLinkForm />}
        items={(linkResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.label,
          href: item.url,
          kind: "link",
        }))}
      />

      <RecordSection
        id="sections"
        title="Sections"
        empty="No extra sections yet."
        editable={editable}
        form={<ProfileSectionForm />}
        items={(sectionResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          kind: "section",
        }))}
      />

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
        id="research"
        title="Research"
        empty="No research added yet."
        editable={editable}
        form={<PublicationForm />}
        items={(publicationResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.venue,
          meta: item.year ? String(item.year) : null,
          href: item.url,
          body: item.summary,
          kind: "publication",
        }))}
      />

      <RecordSection
        id="competitions"
        title="Competitions"
        empty="No competitions added yet."
        editable={editable}
        form={<CompetitionForm />}
        items={(competitionResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.name,
          detail: [item.host, item.result].filter(Boolean).join(" · ") || null,
          meta: item.year ? String(item.year) : null,
          href: item.url,
          kind: "competition",
        }))}
      />

      <RecordSection
        id="communities"
        title="Communities"
        empty="No communities added yet."
        editable={editable}
        form={<CommunityForm />}
        items={(communityResult.data ?? []).map((item) => ({
          id: item.id,
          title: item.name,
          detail: item.role,
          meta: item.year ? String(item.year) : null,
          kind: "community",
        }))}
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
          verified: Boolean(item.verified_at),
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
          verified: Boolean(item.verified_at),
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
        {featured.length > 0 || editable ? (
          <ProjectGroup title="Featured" empty="No featured projects yet.">
            {featured.map((project) => (
              <li key={project.id} className="repo-row">
                <Link href={`/forge/${project.slug}`}>{project.name}</Link>
                {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
                <p>{project.description}</p>
              </li>
            ))}
          </ProjectGroup>
        ) : null}
        <ProjectGroup title="Repositories" empty="No current projects yet.">
          {current.map((project) => (
            <li key={project.id} className="repo-row">
              <div className="repo-title">
                <Link href={`/forge/${project.slug}`}>{project.name}</Link>
                <span className="repo-visibility">{project.visibility === "private" ? "Private" : "Public"}</span>
                <span className="repo-visibility">{project.category}</span>
                {project.subcategory ? <span className="repo-visibility">{project.subcategory}</span> : null}
              </div>
              {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
              <p>{project.description}</p>
              {editable && project.visibility === "public" ? (
                <form action={featureProject}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="feature" value={project.profile_featured_at ? "0" : "1"} />
                  <button className="text-button" type="submit">
                    {project.profile_featured_at ? `Remove ${project.name} from featured` : `Feature ${project.name}`}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ProjectGroup>
        {completed.length > 0 || editable ? (
          <ProjectGroup title="Completed" empty="No completed projects yet.">
            {completed.map((project) => (
              <li key={project.id} className="repo-row">
                <div className="repo-title">
                  <Link href={`/forge/${project.slug}`}>{project.name}</Link>
                  <span className="repo-visibility">Completed</span>
                </div>
                {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
                <p>{project.description}</p>
              </li>
            ))}
          </ProjectGroup>
        ) : null}
        <ProjectGroup title="Contributions" empty="No contributions yet.">
          {(contributed.data ?? []).map((project) => (
            <li key={project.id} className="repo-row">
              <Link href={`/forge/${project.slug}`}>{project.name}</Link>
              {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
              <p>{project.description}</p>
            </li>
          ))}
        </ProjectGroup>
        {editable ? (
          <ProjectGroup title="Saved" empty="No saved projects yet.">
            {(savedProjects.data ?? []).map((project) => (
              <li key={project.id} className="repo-row">
                <Link href={`/forge/${project.slug}`}>{project.name}</Link>
              </li>
            ))}
          </ProjectGroup>
        ) : null}
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
          {item.verified ? <p className="profile-meta">Verified</p> : null}
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
