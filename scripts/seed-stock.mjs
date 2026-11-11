import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

function envValue(name) {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((item) => item.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} is missing from .env.local`);
  return line.slice(name.length + 1).trim().replace(/^"|"$/g, "");
}

const scenes = [
  {
    title: "Bench after the first cut",
    content: "Stock stand-in. A top-down view of a bench, used so the feed has something to show.",
    reel: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="1200" height="800" fill="#c4a574"/>
      <rect x="80" y="90" width="1040" height="620" fill="#8d6a43"/>
      <rect x="140" y="160" width="280" height="40" fill="#d9d3c7"/>
      <rect x="160" y="250" width="90" height="220" rx="8" fill="#2f2a26"/>
      <circle cx="760" cy="340" r="90" fill="#efe6d6"/>
      <rect x="820" y="420" width="220" height="16" fill="#5c6b73"/>
    </svg>`,
  },
  {
    title: "Board with the traces drawn",
    content: "Stock stand-in. A drawn board, not a photograph of anyone's hardware.",
    reel: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="1200" height="800" fill="#143028"/>
      <rect x="160" y="120" width="880" height="560" rx="18" fill="#1f6b45"/>
      <path d="M240 220 H760 V420 H420 V520 H900" fill="none" stroke="#d6c07a" stroke-width="10"/>
      <circle cx="300" cy="300" r="28" fill="#111"/>
      <rect x="640" y="250" width="120" height="70" fill="#111"/>
      <circle cx="820" cy="500" r="22" fill="#efe6d6"/>
    </svg>`,
  },
  {
    title: "Enclosure sketch on paper",
    content: "Stock stand-in. A paper sketch so reels are not an empty grid.",
    reel: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="1200" height="800" fill="#e7e1d6"/>
      <rect x="220" y="110" width="760" height="560" fill="#f7f4ee" stroke="#2c2a26" stroke-width="4"/>
      <rect x="340" y="220" width="520" height="280" fill="none" stroke="#2c2a26" stroke-width="6"/>
      <circle cx="600" cy="360" r="46" fill="none" stroke="#2c2a26" stroke-width="6"/>
      <path d="M300 640 H900" stroke="#b9a48a" stroke-width="2"/>
    </svg>`,
  },
  {
    title: "Sensor sitting in the light",
    content: "Stock stand-in. Flat colour, standing in for a photo of a finished node.",
    reel: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="1200" height="800" fill="#d7e6ef"/>
      <rect x="180" y="460" width="840" height="180" fill="#7ea36b"/>
      <rect x="470" y="250" width="260" height="210" rx="16" fill="#f4f1e8" stroke="#243028" stroke-width="8"/>
      <circle cx="600" cy="330" r="36" fill="#3d6f8a"/>
      <rect x="560" y="390" width="80" height="28" fill="#243028"/>
    </svg>`,
  },
];

const notes = [
  {
    title: "A shorter cell might be enough",
    content: "Stock note. Written so the posts list is not only pictures. It is not a real build log.",
  },
  {
    title: "Leave a vent in the lid",
    content: "Stock note. Another placeholder sentence until builders publish their own posts.",
  },
];

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const secret = envValue("SUPABASE_SECRET_KEY");
const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const email = "stock.samples@mosaic.local";
let userId = null;
const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (listError) throw listError;
userId = listed.users.find((user) => user.email === email)?.id ?? null;
if (!userId) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: `Stock-sample-${randomUUID()}!`,
    email_confirm: true,
  });
  if (createError) throw createError;
  userId = created.user.id;
}

const { error: profileError } = await admin
  .from("profiles")
  .update({
    username: "stock",
    display_name: "Stock",
    bio: "Sample posts and reels. Not a real builder.",
    onboarding_complete: true,
    city: null,
    state: null,
    age_group: "18_24",
  })
  .eq("id", userId);
if (profileError) throw profileError;

const { data: existing, error: existingError } = await admin.from("posts").select("title").eq("author_id", userId);
if (existingError) throw existingError;
const titles = new Set((existing ?? []).map((post) => post.title));

for (const scene of scenes) {
  if (titles.has(scene.title)) continue;
  const bytes = await sharp(Buffer.from(scene.svg)).png().toBuffer();
  const path = `${userId}/${randomUUID()}.png`;
  const { error: uploadError } = await admin.storage.from("post-media").upload(path, bytes, {
    contentType: "image/png",
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: pub } = admin.storage.from("post-media").getPublicUrl(path);
  const { error: insertError } = await admin.from("posts").insert({
    author_id: userId,
    type: "idea",
    title: scene.title,
    content: scene.content,
    visibility: "public",
    media_urls: [pub.publicUrl],
  });
  if (insertError) throw insertError;
}

for (const note of notes) {
  if (titles.has(note.title)) continue;
  const { error: insertError } = await admin.from("posts").insert({
    author_id: userId,
    type: "idea",
    title: note.title,
    content: note.content,
    visibility: "public",
    media_urls: [],
  });
  if (insertError) throw insertError;
}

console.log("Stock posts are in place.");
