import { updateSubcategory } from "@/lib/projects/actions";
import { projectSubcategories, type ProjectCategory } from "@/lib/projects/slug";
import { Label } from "@/components/ui/label";

export function SubcategoryForm({
  projectId,
  category,
  subcategory,
}: {
  projectId: string;
  category: ProjectCategory;
  subcategory: string | null;
}) {
  return (
    <form className="form-stack" action={updateSubcategory}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="edit-subcategory">Subcategory</Label>
        <select id="edit-subcategory" name="subcategory" className="field-select" defaultValue={subcategory ?? ""}>
          <option value="">None</option>
          {projectSubcategories[category].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <button className="text-button" type="submit">
        Save subcategory
      </button>
    </form>
  );
}
