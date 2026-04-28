export const AVATAR_COLORS = [
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
];

export function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "I går";
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}
