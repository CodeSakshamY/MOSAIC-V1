import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { BackButton, OnboardingForm } from "@/components/auth/OnboardingForm";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember, memberGate } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = { title: "Set up your profile" };

const copy: Record<number, { title: string; lede: string }> = {
  1: {
    title: "What should we call you?",
    lede: "Your username is unique. Your display name is what people read first.",
  },
  2: {
    title: "Add a picture",
    lede: "A picture helps people recognise your work. It is optional.",
  },
  3: {
    title: "Where are you building?",
    lede: "City and state are optional. We do not store a street address or coordinates.",
  },
  4: {
    title: "How old are you?",
    lede: "Pick a band. We never ask for a date of birth.",
  },
  5: {
    title: "Education",
    lede: "Optional. This is a short label, not a school record.",
  },
  6: {
    title: "What skills do you use?",
    lede: "Optional. These come from a fixed list so people can find each other.",
  },
  7: {
    title: "What are you into?",
    lede: "Optional. Interests are subjects, not a personality test.",
  },
  8: {
    title: "Links",
    lede: "Optional. GitHub and a website only. Both stay public on your profile.",
  },
  9: {
    title: "What do you want here?",
    lede: "Choose at least one. You can change this later.",
  },
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingSteps />
    </Suspense>
  );
}

async function OnboardingSteps() {
  await connection();
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) redirect("/login?next=/onboarding");
  const gate = memberGate(member);
  if (gate && gate !== "/onboarding") redirect(gate);

  const step = Math.min(Math.max(member.onboardingStep, 1), 9);
  const [skills, interests] = await Promise.all([
    supabase.from("skills").select("id, name").order("name"),
    supabase.from("interests").select("id, name").order("name"),
  ]);
  const text = copy[step] ?? {
    title: "Set up your profile",
    lede: "Finish these steps to reach the feed.",
  };

  return (
    <SectionPage title={text.title} lede={text.lede}>
      {step > 1 ? <BackButton /> : null}
      <OnboardingForm
        step={step}
        skills={skills.data ?? []}
        interests={interests.data ?? []}
      />
    </SectionPage>
  );
}
