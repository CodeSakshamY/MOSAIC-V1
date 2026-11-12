const earliest = "2000-01-01";
const latest = "2100-12-31";
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseProjectDay(value: string) {
  const day = value.trim();
  if (!day) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < earliest || day > latest) return undefined;
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return undefined;
  const parsed = new Date(Date.UTC(year, month - 1, date));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== date) {
    return undefined;
  }
  return day;
}

export function formatProjectDay(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-");
  const name = months[Number(month) - 1];
  if (!year || !name || !day) return null;
  return `${Number(day)} ${name} ${year}`;
}

export function projectTimelineText(startsOn: string | null, endsOn: string | null) {
  const start = formatProjectDay(startsOn);
  const end = formatProjectDay(endsOn);
  if (start && end) return `${start} – ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Ends ${end}`;
  return null;
}
