
export function parseServerTimestamp(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;

  const raw = String(value).trim();
  if (!raw) return null;

  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  if (hasTimezone) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoLike = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(`${isoLike}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(
  createdAt: string | Date | null | undefined,
  nowMs: number = Date.now(),
): string {
  const date = parseServerTimestamp(createdAt);
  if (!date) return "Just now";

  const minutes = Math.max(0, Math.floor((nowMs - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  return `${Math.floor(hours / 24)} days ago`;
}

