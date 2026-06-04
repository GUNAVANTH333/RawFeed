import type { SVGProps } from "react";

/**
 * Incognito ("anonymous") glyph — fedora hat + glasses.
 * Inline SVG so it scales crisply and inherits the current text color
 * via `fill: currentColor`. Size it with a className (e.g. `size-4`).
 */
export function IncognitoIcon({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Hat crown (pinched fedora) */}
      <path d="M92 236 C108 150 132 96 178 92 C208 92 236 120 262 122 C288 120 314 92 344 92 C390 96 412 150 420 236 Z" />
      {/* Brim */}
      <rect x="40" y="230" width="432" height="20" rx="10" />
      {/* Glasses lenses */}
      <circle cx="162" cy="366" r="78" />
      <circle cx="350" cy="366" r="78" />
      {/* Bridge */}
      <rect x="238" y="358" width="36" height="15" rx="7" />
    </svg>
  );
}
