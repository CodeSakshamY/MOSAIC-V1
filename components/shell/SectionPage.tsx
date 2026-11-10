export function SectionPage({
  title,
  lede,
  editorial = false,
  className,
  children,
}: {
  title: string;
  lede: string;
  editorial?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className={className ? `section-page ${className}` : "section-page"}>
      <header className="page-header">
        <h1 className={editorial ? "editorial" : undefined}>{title}</h1>
        <p className="lede">{lede}</p>
      </header>
      {children}
    </article>
  );
}
