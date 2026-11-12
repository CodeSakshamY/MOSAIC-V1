import { isVideoUrl } from "@/lib/auth/images";

export function LogMedia({ urls, title }: { urls: string[]; title: string }) {
  if (urls.length === 0) return null;
  return (
    <ul className="log-media">
      {urls.map((url) => {
        if (url.toLowerCase().includes(".pdf")) {
          return (
            <li key={url}>
              <a href={url}>PDF attachment</a>
            </li>
          );
        }
        if (isVideoUrl(url)) {
          return (
            <li key={url}>
              <video src={url} controls preload="metadata" />
            </li>
          );
        }
        return (
          <li key={url}>
            <img src={url} alt={title} />
          </li>
        );
      })}
    </ul>
  );
}
