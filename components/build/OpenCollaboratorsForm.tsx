import { setOpenToCollaborators } from "@/lib/projects/actions";

export function OpenCollaboratorsForm({ projectId, open }: { projectId: string; open: boolean }) {
  return (
    <form action={setOpenToCollaborators}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="open" value={open ? "0" : "1"} />
      <button className="text-button" type="submit">
        {open ? "Close to collaborators" : "Open to collaborators"}
      </button>
    </form>
  );
}
