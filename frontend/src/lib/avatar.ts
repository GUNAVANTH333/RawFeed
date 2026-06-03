// Deterministic avatar colors derived from a name/pseudonym.
// Shared by comment authors and anonymous thread authors so the same
// identity always gets the same color across the app.
export const ringColors = ["ring-sky-400", "ring-indigo-400", "ring-emerald-400", "ring-orange-400", "ring-red-400", "ring-violet-400"];
export const bgColors = ["bg-sky-50", "bg-indigo-50", "bg-emerald-50", "bg-orange-50", "bg-red-50", "bg-violet-50"];
export const textColors = ["text-sky-500", "text-indigo-500", "text-emerald-500", "text-orange-500", "text-red-500", "text-violet-500"];

export function getColorIdx(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % ringColors.length;
}
