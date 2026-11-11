import Link from "next/link";
import { Settings } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { getMember } from "@/lib/auth/session";

export async function AccountPanel() {
  const member = await getMember();
  if (!member) return null;

  return (
    <div className="sidebar-account">
      <p className="sidebar-note min-[760px]:max-[1099px]:sr-only">{member.displayName}</p>
      <Link href="/settings" className="nav-link">
        <Settings aria-hidden="true" size={18} strokeWidth={1.5} />
        <span className="nav-label min-[760px]:max-[1099px]:sr-only">Settings</span>
      </Link>
      <form action={signOut}>
        <button className="nav-link account-button" type="submit">
          Sign out
        </button>
      </form>
    </div>
  );
}
