export function ForgeIcon({
  size = 18,
  ...props
}: {
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true";
}) {
  return (
    <span
      className="forge-icon"
      style={{ width: size, height: size }}
      aria-hidden={props["aria-hidden"] ?? true}
    />
  );
}
