import { reportPost, reportProfile, reportProject } from "@/lib/safety/actions";

const reasons = [
  ["harassment", "Harassment"],
  ["spam", "Spam"],
  ["inappropriate", "Inappropriate"],
  ["impersonation", "Impersonation"],
  ["unsafe", "Unsafe"],
  ["copyright", "Copyright"],
  ["other", "Other"],
] as const;

const actions = {
  profile: reportProfile,
  post: reportPost,
  project: reportProject,
} as const;

export function ReportForm({
  kind,
  target,
  reported,
}: {
  kind: keyof typeof actions;
  target: string;
  reported: "sent" | "missing" | null;
}) {
  const field = kind === "profile" ? "username" : kind === "post" ? "postId" : "projectId";
  return (
    <div className="report-block">
      {reported === "sent" ? (
        <p className="form-note">
          Report sent. It stays open until someone reviews it.
          {kind === "post" ? " It is hidden from your feeds." : ""}
        </p>
      ) : null}
      {reported === "missing" ? <p className="form-error">Choose a reason. The report was not sent.</p> : null}
      <details className="filter-menu">
        <summary>Report</summary>
        <form className="filter-panel report-form" action={actions[kind]}>
          <input type="hidden" name={field} value={target} />
          <div className="field">
            <label htmlFor={`report-reason-${target}`}>Reason</label>
            <select id={`report-reason-${target}`} name="reason" className="field-select" defaultValue="" required>
              <option value="" disabled>
                Choose one
              </option>
              {reasons.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`report-note-${target}`}>Note</label>
            <textarea id={`report-note-${target}`} name="note" maxLength={1000} rows={3} placeholder="Optional" />
          </div>
          <button className="text-button" type="submit">
            Send report
          </button>
        </form>
      </details>
    </div>
  );
}

export function reportedState(value: string | undefined): "sent" | "missing" | null {
  if (value === "1") return "sent";
  if (value === "missing") return "missing";
  return null;
}
