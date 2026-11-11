import { addGalleryImage, removeGalleryImage, updateCover } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectMedia({
  projectId,
  cover,
  images,
  isOwner,
  isPublic,
}: {
  projectId: string;
  cover: string | null;
  images: { id: string; image_url: string }[];
  isOwner: boolean;
  isPublic: boolean;
}) {
  return (
    <section aria-labelledby="project-pictures">
      <h2 id="project-pictures">Pictures</h2>
      {cover ? <img className="project-cover" src={cover} alt="" /> : <p className="repo-meta">No cover photo yet.</p>}
      {isOwner && isPublic ? (
        <form className="form-stack" action={updateCover}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="field">
            <Label htmlFor="replace-cover">Cover photo</Label>
            <Input id="replace-cover" name="cover" type="file" accept="image/*" />
          </div>
          <button className="text-button" type="submit">
            Save cover
          </button>
        </form>
      ) : null}
      {isOwner && cover ? (
        <form action={updateCover}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="remove" value="1" />
          <button className="text-button" type="submit">
            Remove cover
          </button>
        </form>
      ) : null}
      {images.length > 0 ? (
        <ul className="project-gallery" role="list">
          {images.map((image) => (
            <li key={image.id}>
              <img className="project-photo" src={image.image_url} alt="" />
              {isOwner ? (
                <form action={removeGalleryImage}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <button className="text-button" type="submit">
                    Remove photo
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="repo-meta">No gallery photos yet.</p>
      )}
      {isOwner && isPublic && images.length < 8 ? (
        <form className="form-stack" action={addGalleryImage}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="field">
            <Label htmlFor="gallery-photo">Gallery photo</Label>
            <Input id="gallery-photo" name="photo" type="file" accept="image/*" />
          </div>
          <button className="text-button" type="submit">
            Add photo
          </button>
        </form>
      ) : null}
    </section>
  );
}
