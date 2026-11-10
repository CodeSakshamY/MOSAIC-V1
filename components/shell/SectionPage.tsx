export function SectionPage({
  title,
  lede,
  editorial = false,
  children,
}: {
  title: string;
  lede: string;
  editorial?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className="section-page">
      <header className="page-header">
        <h1 className={editorial ? "editorial" : undefined}>{title}</h1>
        <p className="lede">{lede}</p>
      </header>
      {children}
    </article>
  );
}
