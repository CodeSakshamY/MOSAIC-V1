import { brand } from "@/lib/brand";
import { ageGroups, type AgeGroup } from "@/lib/profile/age-groups";

const usernamePattern = /^[a-z0-9]([a-z0-9_]{1,22}[a-z0-9])?$/;
const githubPattern = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const httpsPattern = /^https:\/\/[^\s]+$/;

export function parseUsername(
  value: string,
): { ok: true; username: string } | { ok: false; error: string } {
  const username = value.trim().toLowerCase();
  if (!usernamePattern.test(username) || username.startsWith("deleted_")) {
    return {
      ok: false,
      error: "Use 3–24 lowercase letters, numbers, or underscores.",
    };
  }
  if ((brand.reservedUsernames as readonly string[]).includes(username)) {
    return { ok: false, error: "That username is reserved." };
  }
  return { ok: true, username };
}

export function parseDisplayName(
  value: string,
): { ok: true; displayName: string } | { ok: false; error: string } {
  const displayName = value.trim();
  if (displayName.length < 1 || displayName.length > 60) {
    return { ok: false, error: "Display name must be 1–60 characters." };
  }
  return { ok: true, displayName };
}

export function parseEmail(
  value: string,
): { ok: true; email: string } | { ok: false; error: string } {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return { ok: true, email };
}

export const passwordHint =
  "Use at least 8 characters, with one uppercase letter, one lowercase letter, and one special character.";

export function parsePassword(
  value: string,
): { ok: true; password: string } | { ok: false; error: string } {
  const strong =
    value.length >= 8 &&
    value.length <= 72 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
  if (!strong) return { ok: false, error: passwordHint };
  return { ok: true, password: value };
}

export function parseAgeGroup(
  value: string,
): { ok: true; ageGroup: AgeGroup } | { ok: false; error: string } {
  const match = ageGroups.find((group) => group.value === value);
  if (!match) {
    return { ok: false, error: "Choose an age band. Accounts start at 13." };
  }
  return { ok: true, ageGroup: match.value };
}

export function parseOptionalText(
  value: string,
  max: number,
  label: string,
): { ok: true; text: string | null } | { ok: false; error: string } {
  const text = value.trim();
  if (!text) return { ok: true, text: null };
  if (text.length > max) {
    return { ok: false, error: `${label} must be ${max} characters or fewer.` };
  }
  return { ok: true, text };
}

export function parseCountry(
  value: string,
): { ok: true; country: string } | { ok: false; error: string } {
  const country = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return { ok: false, error: "Use a two-letter country code, such as IN." };
  }
  return { ok: true, country };
}

export function parseGithubUsername(
  value: string,
): { ok: true; github: string | null } | { ok: false; error: string } {
  const github = value.trim();
  if (!github) return { ok: true, github: null };
  if (!githubPattern.test(github)) {
    return { ok: false, error: "That GitHub username does not look valid." };
  }
  return { ok: true, github };
}

export function parseWebsite(
  value: string,
): { ok: true; website: string | null } | { ok: false; error: string } {
  const website = value.trim();
  if (!website) return { ok: true, website: null };
  if (!httpsPattern.test(website) || website.length > 2000) {
    return { ok: false, error: "Website must be an https link." };
  }
  return { ok: true, website };
}

export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
