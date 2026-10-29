/**
 * Maps an old AngularJS hash URL to the new path, or returns null if the URL
 * is not one. Handles both hash styles AngularJS has used:
 *
 *   /index.html#!/phones/nexus-s  ->  /phones/nexus-s   (1.6 and later, "#!")
 *   /#/phones                     ->  /phones           (before 1.6, "#")
 *
 * Ordinary in-page anchors such as "#specs" are left alone.
 */
export function legacyHashToPath(href: string): string | null {
  const match = /^#!?(\/.*)$/.exec(new URL(href).hash);
  return match?.[1] ?? null;
}
