import { requestContribution, reviewContribution, withdrawContribution } from "@/lib/projects/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Collaboration({
  projectId,
  isOwner,
  canRequest,
  requests,
}: {
  projectId: string;
  isOwner: boolean;
  canRequest: boolean;
  requests: { id: string; name: string; message: string; proposed: string; status: string; mine: boolean }[];
}) {
  const pendingMine = requests.find((request) => request.mine && request.status === "pending");
  const pending = requests.filter((request) => request.status === "pending" && !request.mine);
  const decided = requests.filter((request) => request.status === "accepted" || request.status === "rejected");
  if (!isOwner && !canRequest && !pendingMine) return null;
  return (
    <section className="project-requests" aria-labelledby="project-requests-heading">
      <h2 id="project-requests-heading">Collaboration</h2>
      {isOwner && pending.length === 0 ? <p className="form-note">No requests yet.</p> : null}
      {pending.map((request) => (
        <article key={request.id}>
          <p>
            <strong>{request.name}</strong> wants to contribute.
          </p>
          <p>{request.message}</p>
          <p className="repo-meta">{request.proposed}</p>
          <form action={reviewContribution}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="decision" value="accepted" />
            <button className="text-button" type="submit">
              Accept {request.name}
            </button>
          </form>
          <form action={reviewContribution}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="decision" value="rejected" />
            <button className="text-button" type="submit">
              Decline {request.name}
            </button>
          </form>
        </article>
      ))}
      {decided.map((request) => (
        <p key={request.id}>
          {request.name}: {request.status === "accepted" ? "Accepted" : "Declined"}
        </p>
      ))}
      {pendingMine ? (
        <form action={withdrawContribution}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="requestId" value={pendingMine.id} />
          <p>Request sent. {pendingMine.message}</p>
          <button className="text-button" type="submit">
            Withdraw request
          </button>
        </form>
      ) : null}
      {canRequest && !pendingMine ? (
        <form className="form-stack" action={requestContribution}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="field">
            <Label htmlFor="contribution-message">Message</Label>
            <Textarea id="contribution-message" name="message" required maxLength={1000} rows={3} />
          </div>
          <div className="field">
            <Label htmlFor="contribution-proposal">What you would do</Label>
            <Textarea id="contribution-proposal" name="proposal" required maxLength={1000} rows={3} />
          </div>
          <button className="text-button" type="submit">
            Send request
          </button>
        </form>
      ) : null}
    </section>
  );
}
